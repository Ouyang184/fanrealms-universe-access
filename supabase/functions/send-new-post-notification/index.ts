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
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response('Invalid authentication', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const { postId, creatorId }: PostNotificationRequest = await req.json();

    console.log('Processing notification for post:', postId, 'creator:', creatorId);

    // Authorization check - verify user owns the post and creator profile
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('title, content, created_at, author_id, creator_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      return new Response('Post not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Verify user owns this post
    if (post.author_id !== user.id) {
      console.error('User does not own this post:', { userId: user.id, postAuthorId: post.author_id });
      return new Response('Forbidden', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    // Verify the post belongs to the specified creator
    if (post.creator_id !== creatorId) {
      console.error('Post does not belong to specified creator:', { postCreatorId: post.creator_id, requestedCreatorId: creatorId });
      return new Response('Invalid creator for post', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Additional verification - check if user owns the creator profile
    const { data: creatorData, error: creatorOwnershipError } = await supabase
      .from('creators')
      .select('user_id')
      .eq('id', creatorId)
      .single();

    if (creatorOwnershipError || !creatorData || creatorData.user_id !== user.id) {
      console.error('User does not own creator profile:', { userId: user.id, creatorUserId: creatorData?.user_id });
      return new Response('Forbidden', { 
        status: 403, 
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);