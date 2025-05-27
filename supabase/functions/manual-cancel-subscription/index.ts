
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../stripe-subscriptions/utils/cors.ts';
import { authenticateUser } from '../stripe-subscriptions/utils/auth.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== MANUAL CANCEL SUBSCRIPTION START ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !stripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Missing configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization');
    const user = await authenticateUser(authHeader, supabaseUrl, supabaseAnonKey);
    
    console.log('User authenticated:', user.id);

    // Parse request body to get creator ID
    const { creatorId } = await req.json();
    if (!creatorId) {
      return new Response(JSON.stringify({ error: 'Creator ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Find all subscriptions for this user and creator
    const { data: subscriptions, error: subError } = await supabaseService
      .from('creator_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('creator_id', creatorId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Found subscriptions:', subscriptions?.length || 0);

    let canceledCount = 0;

    // Cancel all active subscriptions for this user/creator pair
    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          // Cancel in Stripe if we have a stripe subscription ID
          if (sub.stripe_subscription_id) {
            console.log('Canceling Stripe subscription:', sub.stripe_subscription_id);
            await stripe.subscriptions.cancel(sub.stripe_subscription_id);
            console.log('Stripe subscription canceled successfully');
          }

          // Update in Supabase
          await supabaseService
            .from('creator_subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('id', sub.id);

          canceledCount++;
          console.log('Updated subscription in database:', sub.id);
        } catch (error) {
          console.error('Error canceling subscription:', sub.id, error);
        }
      }
    }

    // Also clean up basic subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('creator_id', creatorId);

    console.log('Manual cancellation complete. Canceled subscriptions:', canceledCount);

    return new Response(JSON.stringify({ 
      success: true, 
      canceledCount,
      message: `Successfully canceled ${canceledCount} subscription(s)` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in manual cancel:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to cancel subscription' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
