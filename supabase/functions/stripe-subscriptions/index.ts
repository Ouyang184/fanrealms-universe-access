
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

serve(async (req) => {
  console.log('[StripeSubscriptions] === NEW REQUEST RECEIVED ===');
  console.log('[StripeSubscriptions] Method:', req.method);
  console.log('[StripeSubscriptions] URL:', req.url);
  console.log('[StripeSubscriptions] Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('[StripeSubscriptions] Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[StripeSubscriptions] Parsing request body...');
    const body = await req.json();
    const { action } = body;
    
    console.log('[StripeSubscriptions] Action:', action);
    console.log('[StripeSubscriptions] Full request body:', JSON.stringify(body, null, 2));

    // Use LIVE keys consistently
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE');
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY_LIVE not found. Available env vars:', Object.keys(Deno.env.toObject()).filter(key => key.includes('STRIPE')));
      return new Response(JSON.stringify({ 
        error: 'Stripe live secret key not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Using Stripe LIVE key starting with:', stripeSecretKey.substring(0, 12) + '...');

    // Initialize Stripe with LIVE key
    const stripe = new Stripe(stripeSecretKey, {
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

      case 'cancel_subscription': {
        const { subscriptionId, immediate } = body;
        console.log('Processing cancel_subscription with immediate flag:', immediate, 'type:', typeof immediate);
        
        // Ensure immediate is properly converted to boolean
        const immediateFlag = immediate === true || immediate === 'true' || immediate === 1;
        console.log('Converted immediate flag to boolean:', immediateFlag);
        
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
    console.error('Stripe subscriptions error:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : 'No stack trace available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
