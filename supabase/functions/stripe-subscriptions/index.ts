
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders } from './utils/cors.ts';
import { authenticateUser } from './utils/auth.ts';
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import { handleReactivateSubscription } from './handlers/reactivate-subscription.ts';
import { handleVerifySubscription } from './handlers/verify-subscription.ts';
import { handleGetUserSubscriptions } from './handlers/get-user-subscriptions.ts';
import { handleGetSubscriberCount } from './handlers/get-subscriber-count.ts';
import { handleSyncAllSubscriptions } from './handlers/sync-all-subscriptions.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Stripe configuration error' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body once
    const body = await req.json();
    console.log('Stripe subscriptions action:', body.action);
    console.log('Request body received:', JSON.stringify(body, null, 2));

    // Authenticate user (except for sync-all which is internal)
    let user = null;
    if (body.action !== 'sync_all_subscriptions') {
      user = await authenticateUser(req, supabaseService);
    }

    // Route to appropriate handler
    switch (body.action) {
      case 'create_subscription':
        return await handleCreateSubscription(stripe, supabaseService, user, body);
      
      case 'cancel_subscription':
        return await handleCancelSubscription(stripe, supabaseService, user, body.subscriptionId);
      
      case 'reactivate_subscription':
        return await handleReactivateSubscription(stripe, supabaseService, user, body.subscriptionId);
      
      case 'verify_subscription':
        return await handleVerifySubscription(stripe, supabaseService, user, body.tierId, body.creatorId);
      
      case 'get_user_subscriptions':
        return await handleGetUserSubscriptions(stripe, supabaseService, body.userId, body.creatorId);
      
      case 'get_subscriber_count':
        return await handleGetSubscriberCount(supabaseService, body.tierId);
      
      case 'sync_all_subscriptions':
        return await handleSyncAllSubscriptions(stripe, supabaseService);
      
      default:
        console.error('Unknown action:', body.action);
        return new Response(
          JSON.stringify({ error: 'Unknown action' }), 
          { status: 400, headers: corsHeaders }
        );
    }

  } catch (error) {
    console.error('Error in stripe-subscriptions function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
