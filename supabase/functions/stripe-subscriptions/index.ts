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
    console.log('[StripeSubscriptions] Step 1: Parsing request body...');
    const body = await req.json();
    const { action } = body;
    
    console.log('[StripeSubscriptions] Step 2: Action received:', action);
    console.log('[StripeSubscriptions] Full request body:', JSON.stringify(body, null, 2));

    console.log('[StripeSubscriptions] Step 3: Checking Stripe configuration...');
    // Use available Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE') || Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      const availableStripeKeys = Object.keys(Deno.env.toObject()).filter(key => key.includes('STRIPE'));
      console.error('[StripeSubscriptions] ERROR: No Stripe secret key found');
      console.error('[StripeSubscriptions] Available Stripe env vars:', availableStripeKeys);
      return new Response(JSON.stringify({ 
        error: 'Stripe secret key not configured',
        availableKeys: availableStripeKeys
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('[StripeSubscriptions] Step 4: Stripe key found, length:', stripeSecretKey.length);
    console.log('[StripeSubscriptions] Using Stripe key starting with:', stripeSecretKey.substring(0, 12) + '...');

    console.log('[StripeSubscriptions] Step 5: Initializing Stripe client...');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    console.log('[StripeSubscriptions] Step 6: Initializing Supabase service client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[StripeSubscriptions] ERROR: Missing Supabase configuration');
      console.error('[StripeSubscriptions] SUPABASE_URL present:', !!supabaseUrl);
      console.error('[StripeSubscriptions] SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey);
      return new Response(JSON.stringify({ 
        error: 'Supabase configuration missing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[StripeSubscriptions] Step 7: Starting user authentication...');
    const user = await authenticateUser(req, supabaseService);
    console.log('[StripeSubscriptions] Step 8: User authenticated successfully:', user.id);

    console.log('[StripeSubscriptions] Step 9: Routing to action handler for action:', action);
    switch (action) {
      case 'create_subscription':
        console.log('[StripeSubscriptions] Calling handleCreateSubscription...');
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
        console.log('[StripeSubscriptions] ERROR: Invalid action provided:', action);
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }
  } catch (error) {
    console.error('[StripeSubscriptions] === CRITICAL ERROR OCCURRED ===');
    console.error('[StripeSubscriptions] Error type:', error.constructor.name);
    console.error('[StripeSubscriptions] Error message:', error.message);
    console.error('[StripeSubscriptions] Error stack:', error.stack);
    
    // Detailed error analysis
    if (error.message.includes('JSON')) {
      console.error('[StripeSubscriptions] JSON parsing error - malformed request body');
      return new Response(JSON.stringify({ 
        error: 'Invalid request format',
        details: 'Request body must be valid JSON'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    if (error.message.includes('Authentication') || error.message.includes('Authorization')) {
      console.error('[StripeSubscriptions] Authentication error detected');
      return new Response(JSON.stringify({ 
        error: 'Authentication failed - please log in again',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    
    if (error.message.includes('Stripe') || error.type) {
      console.error('[StripeSubscriptions] Stripe API error detected');
      return new Response(JSON.stringify({ 
        error: 'Payment service error',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402,
      });
    }
    
    // Generic server error with full details
    console.error('[StripeSubscriptions] Unhandled server error');
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : 'No stack trace available',
      errorType: error.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});