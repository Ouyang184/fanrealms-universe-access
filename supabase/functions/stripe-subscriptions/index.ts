
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
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('📋 [STRIPE-SUBSCRIPTIONS] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 [STRIPE-SUBSCRIPTIONS] Processing request:', {
      method: req.method,
      url: req.url
    });

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('📦 [STRIPE-SUBSCRIPTIONS] Request body parsed:', body);
    } catch (parseError) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Body parse error:', parseError.message);
      return createJsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    // Validate environment variables - USE CORRECT TEST KEYS
    const stripeKey = 'sk_test_51RSMPcCli7UywJensn3y9KsPnepDG3FWA2y7my2jsO84UfXioisT0Txs4ll2cUuYlIBjNiydl7PSb9vc3cIxsQdO00b3LQtLHZ';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔑 [STRIPE-SUBSCRIPTIONS] Environment check (SANDBOX MODE):', {
      hasStripeKey: !!stripeKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!stripeKey) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Missing Stripe sandbox key');
      return createJsonResponse({ error: 'Missing Stripe sandbox configuration' }, 500);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ [STRIPE-SUBSCRIPTIONS] Missing Supabase config');
      return createJsonResponse({ error: 'Missing Supabase configuration' }, 500);
    }

    // Initialize clients
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔧 [STRIPE-SUBSCRIPTIONS] Clients initialized (SANDBOX MODE)');

    // Authenticate user
    const user = await authenticateUser(req, supabase);
    console.log('👤 [STRIPE-SUBSCRIPTIONS] User authenticated:', user.id);

    // Handle different actions
    const action = body.action;
    console.log('🎯 [STRIPE-SUBSCRIPTIONS] Action:', action);

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
