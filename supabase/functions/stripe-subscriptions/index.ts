
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticateUser } from './utils/auth.ts';
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import { handleReactivateSubscription } from './handlers/reactivate-subscription.ts';
import { createJsonResponse } from './utils/cors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 [STRIPE-SUBSCRIPTIONS] Function started (SANDBOX MODE)');
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

    // Parse request body with detailed error handling
    let body;
    try {
      const bodyText = await req.text();
      console.log('📝 [STRIPE-SUBSCRIPTIONS] Raw body received:', bodyText.length > 0 ? 'Non-empty' : 'Empty');
      
      if (!bodyText) {
        console.log('❌ [STRIPE-SUBSCRIPTIONS] Empty request body');
        return createJsonResponse({ error: 'Request body is required' }, 400);
      }
      
      body = JSON.parse(bodyText);
      console.log('📦 [STRIPE-SUBSCRIPTIONS] Request body parsed successfully:', {
        action: body?.action,
        hasClientSecret: !!body?.clientSecret,
        bodyKeys: Object.keys(body || {})
      });
    } catch (parseError) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Body parse error:', {
        message: parseError.message,
        name: parseError.name
      });
      return createJsonResponse({ error: 'Invalid JSON body', details: parseError.message }, 400);
    }

    // Validate environment variables - USE CORRECT TEST KEYS
    const stripeKey = 'sk_test_51RSMPcCli7UywJensn3y9KsPnepDG3FWA2y7my2jsO84UfXioisT0Txs4ll2cUuYlIBjNiydl7PSb9vc3cIxsQdO00b3LQtLHZ';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔑 [STRIPE-SUBSCRIPTIONS] Environment check (SANDBOX MODE):', {
      hasStripeKey: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 12) + '...' : 'N/A',
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrlDomain: supabaseUrl ? new URL(supabaseUrl).hostname : 'N/A',
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 12) + '...' : 'N/A'
    });

    if (!stripeKey) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Missing Stripe sandbox key');
      return createJsonResponse({ error: 'Missing Stripe sandbox configuration' }, 500);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Missing Supabase config');
      return createJsonResponse({ error: 'Missing Supabase configuration' }, 500);
    }

    // Test Stripe key validity
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
      console.log('🔧 [STRIPE-SUBSCRIPTIONS] Testing Stripe key...');
      await stripe.balance.retrieve();
      console.log('✅ [STRIPE-SUBSCRIPTIONS] Stripe key is valid');
    } catch (stripeTestError) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Stripe key test failed:', {
        message: stripeTestError.message,
        type: stripeTestError.type,
        code: stripeTestError.code
      });
      return createJsonResponse({ 
        error: 'Invalid Stripe configuration', 
        details: stripeTestError.message 
      }, 500);
    }

    // Initialize clients
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔧 [STRIPE-SUBSCRIPTIONS] Clients initialized successfully');

    // Authenticate user with detailed logging
    let user;
    try {
      user = await authenticateUser(req, supabase);
      console.log('👤 [STRIPE-SUBSCRIPTIONS] User authenticated successfully:', {
        userId: user.id,
        email: user.email,
        hasEmail: !!user.email
      });
    } catch (authError) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Authentication failed:', {
        message: authError.message,
        name: authError.name,
        stack: authError.stack?.substring(0, 200) + '...'
      });
      return createJsonResponse({ 
        error: 'Authentication failed', 
        details: authError.message 
      }, 401);
    }

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
          
          // Try to cancel the payment intent
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
          
        } catch (error) {
          console.log('❌ [STRIPE-SUBSCRIPTIONS] Payment intent cancellation error:', {
            message: error.message,
            type: error.type,
            code: error.code,
            decline_code: error.decline_code,
            payment_intent: error.payment_intent?.id,
            stack: error.stack?.substring(0, 300) + '...'
          });
          
          // Return specific error details for better debugging
          return createJsonResponse({ 
            error: 'Failed to cancel payment intent',
            details: error.message,
            stripe_error_type: error.type,
            stripe_error_code: error.code
          }, 500);
        }
        
      default:
        console.log('❌ [STRIPE-SUBSCRIPTIONS] Unknown action:', action);
        return createJsonResponse({ error: `Unknown action: ${action}` }, 400);
    }

  } catch (error) {
    console.log('💥 [STRIPE-SUBSCRIPTIONS] CRITICAL ERROR (SANDBOX MODE):', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return createJsonResponse({ 
      error: 'Internal server error',
      details: error.message
    }, 500);
  }
});
