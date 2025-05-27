
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflightRequest, createJsonResponse } from './utils/cors.ts';
import { authenticateUser } from './utils/auth.ts';
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import type { SubscriptionRequest } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    console.log('Stripe subscriptions function called');
    console.log('Request method:', req.method);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    // Authenticate user
    const user = await authenticateUser(authHeader, supabaseUrl, supabaseAnonKey);
    console.log('User authenticated:', user.id);

    // Parse request body
    let requestBody: SubscriptionRequest;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.log('ERROR: Failed to parse request body:', parseError);
      return createJsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    // Handle both parameter naming conventions and validate required fields
    const { 
      action, 
      tier_id, 
      creator_id, 
      tierId = tier_id, 
      creatorId = creator_id, 
      subscriptionId 
    } = requestBody;
    
    console.log('Extracted parameters:', { 
      action, 
      tierId: tierId || tier_id, 
      creatorId: creatorId || creator_id, 
      subscriptionId 
    });

    if (!action) {
      console.log('ERROR: Missing action in request');
      return createJsonResponse({ error: 'Missing action parameter' }, 400);
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.log('ERROR: Missing Stripe secret key');
      return createJsonResponse({ error: 'Missing Stripe configuration' }, 500);
    }

    console.log('Stripe secret key found');

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (action === 'create_subscription') {
      if (!tierId || !creatorId) {
        console.log('ERROR: Missing required parameters for create_subscription');
        console.log('Required: tierId, creatorId');
        console.log('Received:', { tierId, creatorId });
        return createJsonResponse({ 
          error: 'Missing required parameters: tierId and creatorId are required' 
        }, 400);
      }

      return await handleCreateSubscription(
        stripe, 
        supabase, 
        supabaseService, 
        user, 
        tierId, 
        creatorId
      );
    } else if (action === 'cancel_subscription') {
      if (!subscriptionId) {
        console.log('ERROR: Missing subscriptionId for cancel_subscription');
        return createJsonResponse({ error: 'Missing required parameter: subscriptionId' }, 400);
      }

      return await handleCancelSubscription(
        stripe,
        supabaseService,
        user,
        subscriptionId
      );
    }

    console.log('ERROR: Invalid action:', action);
    return createJsonResponse({ error: 'Invalid action. Supported actions: create_subscription, cancel_subscription' }, 400);

  } catch (error) {
    console.error('Subscription error:', error);
    return createJsonResponse({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, 500);
  }
});
