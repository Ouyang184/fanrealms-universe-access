
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from './utils/auth.ts';
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import { handleReactivateSubscription } from './handlers/reactivate-subscription.ts';
import { handleGetUserSubscriptions } from './handlers/get-user-subscriptions.ts';
import { createJsonResponse } from './utils/cors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 [STRIPE-SUBSCRIPTIONS] Function started (TEST MODE)');
  console.log('📍 [STRIPE-SUBSCRIPTIONS] Request details:', {
    method: req.method,
    url: req.url,
    headers: {
      authorization: req.headers.get('Authorization') ? 'Bearer [PRESENT]' : '[MISSING]',
      contentType: req.headers.get('Content-Type'),
      userAgent: req.headers.get('User-Agent')
    }
  });
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('📋 [STRIPE-SUBSCRIPTIONS] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 [STRIPE-SUBSCRIPTIONS] Processing request...');

    // Validate environment variables - USE TEST/SANDBOX KEYS FIRST
    const stripeKey =
      Deno.env.get('STRIPE_SECRET_KEY_TEST') ||
      Deno.env.get('STRIPE_SECRET_KEY_SANDBOX') ||
      Deno.env.get('STRIPE_SECRET_KEY') ||
      Deno.env.get('STRIPE_SECRET_KEY_LIVE');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey) {
      return createJsonResponse({ error: 'Missing Stripe configuration' }, 500);
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      return createJsonResponse({ error: 'Missing Supabase configuration' }, 500);
    }

    // Initialize Supabase client (needed to authenticate user)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // AUTH FIRST: Authenticate user before parsing body or calling Stripe
    let user;
    try {
      user = await authenticateUser(req, supabase);
    } catch (authError) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Authentication failed:', authError?.message);
      return createJsonResponse({ error: 'Authentication failed' }, 401);
    }

    // Limit pre-parse body size
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 16 * 1024) {
      return createJsonResponse({ error: 'Request body too large' }, 413);
    }

    // Parse request body (post-auth)
    let body;
    try {
      const bodyText = await req.text();
      if (!bodyText) {
        return createJsonResponse({ error: 'Request body is required' }, 400);
      }
      body = JSON.parse(bodyText);
    } catch (parseError) {
      return createJsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    // Initialize Stripe client
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Handle different actions
    const action = body.action;
    console.log('🎯 [STRIPE-SUBSCRIPTIONS] Processing action:', action);

    switch (action) {
      case 'create_subscription':
        return await handleCreateSubscription(stripe, supabase, user, body);
        
      case 'cancel_subscription':
        return await handleCancelSubscription(
          stripe, 
          supabase, 
          user, 
          body.subscriptionId, 
          body.immediate
        );
        
      case 'reactivate_subscription':
        return await handleReactivateSubscription(
          stripe, 
          supabase, 
          user, 
          body.subscriptionId
        );

      case 'get_user_subscriptions':
        // SECURITY: Ignore client-supplied userId; handler uses authenticated user.id only
        return await handleGetUserSubscriptions(
          supabase,
          user
        );

      case 'cancel_payment_intent':
        try {
          console.log('💸 [STRIPE-SUBSCRIPTIONS] Starting payment intent cancellation');
          console.log('🔍 [STRIPE-SUBSCRIPTIONS] Client secret details:', {
            hasClientSecret: !!body.clientSecret,
            clientSecretLength: body.clientSecret?.length,
            clientSecretPrefix: body.clientSecret?.substring(0, 12) + '...',
            includesSecret: body.clientSecret?.includes('_secret_')
          });
          
          if (!body.clientSecret) {
            console.log('❌ [STRIPE-SUBSCRIPTIONS] No client secret provided');
            return createJsonResponse({ error: 'Client secret is required' }, 400);
          }
          
          // Extract payment intent ID from client secret
          const paymentIntentId = body.clientSecret.split('_secret_')[0];
          console.log('🔍 [STRIPE-SUBSCRIPTIONS] Extracted payment intent ID:', paymentIntentId);
          
          if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
            console.log('❌ [STRIPE-SUBSCRIPTIONS] Invalid payment intent ID format:', paymentIntentId);
            return createJsonResponse({ 
              error: 'Invalid client secret format', 
              details: 'Could not extract valid payment intent ID' 
            }, 400);
          }

          // First, check if the payment intent exists and its current status
          let currentPaymentIntent;
          try {
            currentPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            console.log('🔍 [STRIPE-SUBSCRIPTIONS] Current payment intent status:', {
              id: currentPaymentIntent.id,
              status: currentPaymentIntent.status,
              amount: currentPaymentIntent.amount
            });
          } catch (retrieveError) {
            console.log('❌ [STRIPE-SUBSCRIPTIONS] Payment intent not found:', retrieveError.message);
            // If payment intent doesn't exist, consider it successfully "cancelled"
            return createJsonResponse({ 
              success: true, 
              cancelled: paymentIntentId,
              status: 'not_found',
              message: 'Payment intent not found - considered cancelled'
            });
          }

          // Verify the payment intent belongs to the authenticated user's Stripe customer
          const { data: customerRow } = await supabase
            .from('stripe_customers')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle();

          const callerCustomerId = customerRow?.stripe_customer_id;
          if (!callerCustomerId || currentPaymentIntent.customer !== callerCustomerId) {
            console.warn('🚫 [STRIPE-SUBSCRIPTIONS] cancel_payment_intent ownership mismatch', {
              paymentIntentId,
              piCustomer: currentPaymentIntent.customer,
              callerCustomerId,
              userId: user.id,
            });
            return createJsonResponse({ error: 'Forbidden' }, 403);
          }

          // Check if payment intent is in a cancellable state
          if (currentPaymentIntent.status === 'canceled') {
            console.log('✅ [STRIPE-SUBSCRIPTIONS] Payment intent already cancelled');
            return createJsonResponse({ 
              success: true, 
              cancelled: paymentIntentId,
              status: 'already_canceled' 
            });
          }

          if (currentPaymentIntent.status === 'succeeded') {
            console.log('ℹ️ [STRIPE-SUBSCRIPTIONS] Payment intent already succeeded - cannot cancel');
            return createJsonResponse({ 
              success: false, 
              cancelled: paymentIntentId,
              status: 'succeeded',
              message: 'Payment already succeeded - cannot cancel'
            });
          }

          // Only attempt cancellation if in a cancellable state
          if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(currentPaymentIntent.status)) {
            console.log('🚫 [STRIPE-SUBSCRIPTIONS] Attempting to cancel payment intent:', paymentIntentId);
            const cancelledPaymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
            
            console.log('✅ [STRIPE-SUBSCRIPTIONS] Payment intent cancelled successfully:', {
              id: cancelledPaymentIntent.id,
              status: cancelledPaymentIntent.status,
              amount: cancelledPaymentIntent.amount
            });
            
            return createJsonResponse({ 
              success: true, 
              cancelled: paymentIntentId,
              status: cancelledPaymentIntent.status 
            });
          } else {
            console.log('ℹ️ [STRIPE-SUBSCRIPTIONS] Payment intent not in cancellable state:', currentPaymentIntent.status);
            return createJsonResponse({ 
              success: false, 
              cancelled: paymentIntentId,
              status: currentPaymentIntent.status,
              message: `Payment intent in ${currentPaymentIntent.status} state - cannot cancel`
            });
          }
          
        } catch (error) {
          console.log('❌ [STRIPE-SUBSCRIPTIONS] Payment intent cancellation error:', {
            message: error.message,
            type: error.type,
            code: error.code,
            decline_code: error.decline_code,
            payment_intent: error.payment_intent?.id,
            stack: error.stack?.substring(0, 300) + '...'
          });
          
          // Handle specific Stripe error codes more gracefully
          if (error.code === 'payment_intent_unexpected_state') {
            return createJsonResponse({ 
              success: false,
              cancelled: body.clientSecret?.split('_secret_')[0],
              error: 'Payment intent cannot be cancelled in current state',
              message: 'Payment may have already been processed or cancelled'
            }, 200);
          }

          return createJsonResponse({ 
            success: false,
            error: 'Failed to cancel payment intent',
            message: 'Payment cancellation failed but you can still navigate away'
          }, 200);
        }
        
      default:
        console.log('❌ [STRIPE-SUBSCRIPTIONS] Unknown action:', action);
        return createJsonResponse({ error: `Unknown action: ${action}` }, 400);
    }

  } catch (error) {
    console.log('💥 [STRIPE-SUBSCRIPTIONS] CRITICAL ERROR (TEST MODE):', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return createJsonResponse({ error: 'Internal server error' }, 500);
  }
});
