import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from './utils/cors.ts';
import { authenticateUser } from './utils/auth.ts';
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import { handleReactivateSubscription } from './handlers/reactivate-subscription.ts';
import { handleGetUserSubscriptions } from './handlers/get-user-subscriptions.ts';
import { handleGetSubscriberCount } from './handlers/get-subscriber-count.ts';
import { handleVerifySubscription } from './handlers/verify-subscription.ts';
import { handleSyncAllSubscriptions } from './handlers/sync-all-subscriptions.ts';
import { handleCompleteSubscription } from './handlers/complete-subscription.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    
    console.log('Stripe subscriptions action:', action, '(TEST MODE)');
    console.log('Request body received:', JSON.stringify(body, null, 2));

    // Initialize Stripe with TEST keys for subscriptions
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_TEST') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase (service role for admin operations)
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Authenticate user for most actions
    const user = await authenticateUser(req, supabaseService);

    switch (action) {
      case 'create_subscription':
        return await handleCreateSubscription(stripe, supabaseService, user, body);

      case 'complete_subscription': {
        const { setupIntentId } = body;
        return await handleCompleteSubscription(stripe, supabaseService, user, { setupIntentId });
      }

      case 'cancel_subscription': {
        const { subscriptionId, immediate } = body;
        console.log('Processing cancel_subscription with immediate flag:', immediate, 'type:', typeof immediate, '(TEST MODE)');
        
        // Ensure immediate is properly converted to boolean
        const immediateFlag = immediate === true || immediate === 'true' || immediate === 1;
        console.log('Converted immediate flag to boolean:', immediateFlag, '(TEST MODE)');
        
        return await handleCancelSubscription(stripe, supabaseService, user, subscriptionId, immediateFlag);
      }

      case 'reactivate_subscription': {
        const { subscriptionId } = body;
        return await handleReactivateSubscription(stripe, supabaseService, user, subscriptionId);
      }

      case 'get_user_subscriptions': {
        const { userId } = body;
        return await handleGetUserSubscriptions(supabaseService, user, userId);
      }

      case 'get_subscriber_count': {
        const { creatorId } = body;
        return await handleGetSubscriberCount(supabaseService, creatorId);
      }

      case 'verify_subscription': {
        const { subscriptionId } = body;
        return await handleVerifySubscription(stripe, supabaseService, subscriptionId);
      }

      case 'sync_all_subscriptions': {
        return await handleSyncAllSubscriptions(stripe, supabaseService);
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    console.error('Stripe subscriptions error (TEST MODE):', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
