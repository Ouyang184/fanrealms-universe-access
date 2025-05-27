
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCorsPreflightRequest, createJsonResponse } from './utils/cors.ts';
import { authenticateUser } from './utils/auth.ts';
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import { handleVerifySubscription } from './handlers/verify-subscription.ts';
import { handleGetSubscriberCount } from './handlers/get-subscriber-count.ts';
import { handleGetUserSubscriptions } from './handlers/get-user-subscriptions.ts';
import { handleSyncAllSubscriptions } from './handlers/sync-all-subscriptions.ts';
import type { SubscriptionRequest } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    console.log('=== STRIPE SUBSCRIPTIONS FUNCTION START ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseAnonKey: supabaseAnonKey ? 'SET' : 'MISSING',
      supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING',
      stripeSecretKey: stripeSecretKey ? 'SET' : 'MISSING'
    });

    if (!supabaseUrl || !supabaseAnonKey || !stripeSecretKey || !supabaseServiceKey) {
      console.log('ERROR: Missing required environment variables');
      return createJsonResponse({ error: 'Missing required configuration' }, 500);
    }

    const authHeader = req.headers.get('Authorization');

    // Parse request body
    let requestBody: SubscriptionRequest;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        console.log('ERROR: Empty request body');
        return createJsonResponse({ error: 'Request body is empty' }, 400);
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.log('ERROR: Failed to parse request body:', parseError);
      return createJsonResponse({ error: 'Invalid JSON in request body: ' + parseError.message }, 400);
    }

    const { 
      action, 
      tier_id, 
      creator_id, 
      tierId = tier_id, 
      creatorId = creator_id, 
      subscriptionId,
      userId 
    } = requestBody;
    
    console.log('Extracted parameters:', { 
      action, 
      tierId: tierId || tier_id, 
      creatorId: creatorId || creator_id, 
      subscriptionId,
      userId 
    });

    if (!action) {
      console.log('ERROR: Missing action in request');
      return createJsonResponse({ error: 'Missing action parameter' }, 400);
    }

    console.log('Creating Stripe client...');
    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey);
    
    console.log('Creating Supabase clients...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Handle actions that don't require authentication
    if (action === 'verify_subscription') {
      if (!subscriptionId) {
        return createJsonResponse({ error: 'Missing subscriptionId' }, 400);
      }
      return await handleVerifySubscription(stripe, supabaseService, subscriptionId);
    }

    if (action === 'get_subscriber_count') {
      if (!tierId || !creatorId) {
        return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
      }
      return await handleGetSubscriberCount(stripe, supabaseService, tierId, creatorId);
    }

    if (action === 'sync_all_subscriptions') {
      return await handleSyncAllSubscriptions(stripe, supabaseService, creatorId);
    }

    // For actions that require authentication
    let user;
    try {
      user = await authenticateUser(authHeader, supabaseUrl, supabaseAnonKey);
      console.log('User authenticated successfully:', { userId: user.id, email: user.email });
    } catch (authError) {
      console.log('ERROR: Authentication failed:', authError);
      return createJsonResponse({ error: 'Authentication failed: ' + authError.message }, 401);
    }

    if (action === 'create_subscription') {
      if (!tierId || !creatorId) {
        console.log('ERROR: Missing required parameters for create_subscription');
        return createJsonResponse({ 
          error: 'Missing required parameters: tierId and creatorId are required' 
        }, 400);
      }

      console.log('Calling handleCreateSubscription...');
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

      console.log('Calling handleCancelSubscription...');
      return await handleCancelSubscription(
        stripe,
        supabaseService,
        user,
        subscriptionId
      );
    } else if (action === 'get_user_subscriptions') {
      if (!creatorId) {
        return createJsonResponse({ error: 'Missing creatorId' }, 400);
      }
      return await handleGetUserSubscriptions(stripe, supabaseService, user.id, creatorId);
    }

    console.log('ERROR: Invalid action:', action);
    return createJsonResponse({ 
      error: 'Invalid action. Supported actions: create_subscription, cancel_subscription, verify_subscription, get_subscriber_count, get_user_subscriptions, sync_all_subscriptions' 
    }, 400);

  } catch (error) {
    console.error('=== SUBSCRIPTION FUNCTION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return createJsonResponse({ 
      error: error.message || 'Internal server error',
      details: error.toString(),
      type: error.constructor.name
    }, 500);
  }
});
