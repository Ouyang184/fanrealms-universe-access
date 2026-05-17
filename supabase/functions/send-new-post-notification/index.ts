import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostNotificationRequest {
  postId: string;
  creatorId: string;
}

interface SendGridEmailData {
  creator_name: string;
  creator_avatar: string;
  update_title: string;
  update_summary: string;
  post_date: string;
  view_update_link: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Require an authenticated caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth client (uses caller's JWT) for identity verification
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerUserId = claimsData.claims.sub;

    // Service-role client for the rest of the work (bypasses RLS for follower lookups, etc.)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { postId, creatorId }: PostNotificationRequest = await req.json();

    if (!postId || !creatorId) {
      return new Response(JSON.stringify({ error: 'postId and creatorId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing notification for post:', postId, 'creator:', creatorId);

    // Verify the caller owns the creator account they're sending notifications for
    const { data: creatorOwner, error: ownerError } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', creatorId)
      .single();

    if (ownerError || !creatorOwner || creatorOwner.user_id !== callerUserId) {
      console.error('Caller is not the owner of the creator account', { callerUserId, creatorId });
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get post details and verify it belongs to this creator
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('title, content, created_at, creator_id, author_id')
      .eq('id', postId)
      .single();

    if (post && post.creator_id && post.creator_id !== creatorId) {
      return new Response(JSON.stringify({ error: 'Post does not belong to this creator' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      return new Response('Post not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Get creator details
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select(`
        display_name,
        profile_image_url,
        users!inner(username)
      `)
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      console.error('Error fetching creator:', creatorError);
      return new Response('Creator not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Get followers who have email notifications enabled
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select(`
        users!inner(
          email,
          notification_preferences
        )
      `)
      .eq('creator_id', creatorId);

    if (followersError) {
      console.error('Error fetching followers:', followersError);
      return new Response('Error fetching followers', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Filter followers who want email notifications for new content
    const emailRecipients = followers?.filter(follow => {
      const prefs = follow.users.notification_preferences as any;
      return prefs?.email_notifications === true && prefs?.new_content_alerts === true;
    }).map(follow => follow.users.email) || [];

    console.log(`Found ${emailRecipients.length} recipients for notification`);

    if (emailRecipients.length === 0) {
      return new Response('No recipients found', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Prepare email data for SendGrid dynamic template
    const emailData: SendGridEmailData = {
      creator_name: creator.display_name || creator.users.username,
      creator_avatar: creator.profile_image_url || '',
      update_title: post.title,
      update_summary: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      post_date: new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      view_update_link: `${Deno.env.get('SUPABASE_URL')?.replace('/auth/v1', '')}/post/${postId}`
    };

    // Send emails via SendGrid
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_SENDER_EMAIL');
    const templateId = 'd-b947a3c61a1e480180edb26bd8f58004';

    if (!sendGridApiKey || !fromEmail) {
      console.error('SendGrid configuration missing');
      return new Response('Email service not configured', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Send batch email
    const emailPayload = {
      from: { email: fromEmail },
      personalizations: emailRecipients.map(email => ({
        to: [{ email }],
        dynamic_template_data: emailData
      })),
      template_id: templateId
    };

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('SendGrid error:', errorText);
      return new Response('Failed to send emails', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    console.log(`Successfully sent ${emailRecipients.length} email notifications`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent: emailRecipients.length 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-new-post-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);