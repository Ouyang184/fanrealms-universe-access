
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function for consistent logging
const log = (step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [StripeSubscriptions] ${step}`);
  if (data) {
    console.log(`[${timestamp}] [StripeSubscriptions] Data:`, JSON.stringify(data, null, 2));
  }
};

// Helper function for error responses
const errorResponse = (message: string, status: number = 500, details?: any) => {
  log(`ERROR: ${message}`, details);
  return new Response(JSON.stringify({ 
    error: message,
    ...(details && { details })
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status
  });
};

// Helper function for success responses
const successResponse = (data: any) => {
  log('Success response', data);
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('Function started', { method: req.method, url: req.url });

    // Validate environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'STRIPE_SECRET_KEY_LIVE'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !Deno.env.get(envVar));
    if (missingEnvVars.length > 0) {
      return errorResponse(
        'Server configuration error - missing environment variables',
        500,
        { missingVars: missingEnvVars }
      );
    }

    log('Environment variables validated');

    // Initialize Stripe
    let stripe;
    try {
      const stripeModule = await import('https://esm.sh/stripe@14.21.0');
      stripe = stripeModule.default(Deno.env.get('STRIPE_SECRET_KEY_LIVE') || '');
      log('Stripe initialized successfully');
    } catch (stripeError) {
      return errorResponse(
        'Failed to initialize Stripe',
        500,
        { error: stripeError.message }
      );
    }

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid authorization header', 401);
    }

    log('Authorization header validated');

    // Initialize Supabase clients
    let supabase, userSupabase;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

      supabase = createClient(supabaseUrl, supabaseServiceKey);
      userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      log('Supabase clients initialized');
    } catch (supabaseError) {
      return errorResponse(
        'Failed to initialize Supabase clients',
        500,
        { error: supabaseError.message }
      );
    }

    // Authenticate user
    let user;
    try {
      log('Authenticating user...');
      const { data: { user: authUser }, error: authError } = await userSupabase.auth.getUser();
      
      if (authError) {
        log('Authentication error', authError);
        return errorResponse(
          `Authentication failed: ${authError.message}`,
          401,
          { authError }
        );
      }

      if (!authUser) {
        return errorResponse('User not authenticated', 401);
      }

      user = authUser;
      log('User authenticated successfully', { userId: user.id, email: user.email });
    } catch (authError) {
      return errorResponse(
        'Authentication process failed',
        500,
        { error: authError.message }
      );
    }

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      log('Raw request body received', { bodyLength: bodyText.length });
      
      if (!bodyText.trim()) {
        return errorResponse('Request body is empty', 400);
      }
      
      requestBody = JSON.parse(bodyText);
      log('Request body parsed successfully', requestBody);
    } catch (parseError) {
      return errorResponse(
        'Invalid JSON in request body',
        400,
        { error: parseError.message }
      );
    }

    // Validate required fields
    const { action, tierId, creatorId, subscriptionId, immediate } = requestBody;
    
    if (!action || typeof action !== 'string') {
      return errorResponse('Missing or invalid action field', 400);
    }

    log('Processing action', { action, tierId, creatorId, subscriptionId, immediate });

    // Validate UUID format for relevant fields
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (tierId && !uuidRegex.test(tierId)) {
      return errorResponse('Invalid tierId format', 400);
    }
    
    if (creatorId && !uuidRegex.test(creatorId)) {
      return errorResponse('Invalid creatorId format', 400);
    }
    
    if (subscriptionId && !uuidRegex.test(subscriptionId)) {
      return errorResponse('Invalid subscriptionId format', 400);
    }

    // Handle different actions
    let result;
    try {
      switch (action) {
        case 'create_subscription':
          if (!tierId || !creatorId) {
            return errorResponse(
              'Missing required fields: tierId and creatorId are required for create_subscription',
              400
            );
          }
          
          log('Calling create subscription handler');
          const { handleCreateSubscription } = await import('./handlers/create-subscription.ts');
          result = await handleCreateSubscription(stripe, supabase, user, { tierId, creatorId });
          break;

        case 'cancel_subscription':
          if (!tierId || !creatorId) {
            return errorResponse(
              'Missing required fields: tierId and creatorId are required for cancel_subscription',
              400
            );
          }
          
          log('Calling cancel subscription handler');
          const { handleCancelSubscription } = await import('./handlers/cancel-subscription.ts');
          result = await handleCancelSubscription(stripe, supabase, user, { tierId, creatorId, immediate });
          break;

        case 'get_user_subscriptions':
          log('Calling get user subscriptions handler');
          const { handleGetUserSubscriptions } = await import('./handlers/get-user-subscriptions.ts');
          result = await handleGetUserSubscriptions(supabase, user);
          break;

        case 'verify_subscription':
          if (!tierId || !creatorId) {
            return errorResponse(
              'Missing required fields: tierId and creatorId are required for verify_subscription',
              400
            );
          }
          
          log('Calling verify subscription handler');
          const { handleVerifySubscription } = await import('./handlers/verify-subscription.ts');
          result = await handleVerifySubscription(stripe, supabase, user, { tierId, creatorId });
          break;

        case 'reactivate_subscription':
          if (!subscriptionId) {
            return errorResponse(
              'Missing required field: subscriptionId is required for reactivate_subscription',
              400
            );
          }
          
          log('Calling reactivate subscription handler');
          const { handleReactivateSubscription } = await import('./handlers/reactivate-subscription.ts');
          result = await handleReactivateSubscription(stripe, supabase, user, { subscriptionId });
          break;

        case 'get_subscriber_count':
          if (!creatorId) {
            return errorResponse(
              'Missing required field: creatorId is required for get_subscriber_count',
              400
            );
          }
          
          log('Calling get subscriber count handler');
          const { handleGetSubscriberCount } = await import('./handlers/get-subscriber-count.ts');
          result = await handleGetSubscriberCount(stripe, supabase, creatorId);
          break;

        case 'sync_all_subscriptions':
          log('Calling sync all subscriptions handler');
          const { handleSyncAllSubscriptions } = await import('./handlers/sync-all-subscriptions.ts');
          result = await handleSyncAllSubscriptions(stripe, supabase, user);
          break;

        default:
          return errorResponse(`Invalid action: ${action}`, 400);
      }

      log('Action completed successfully', { action, result });
      return successResponse(result);

    } catch (handlerError) {
      log('Handler error', { action, error: handlerError.message, stack: handlerError.stack });
      
      // Check if it's a Stripe error
      if (handlerError.type && handlerError.type.startsWith('Stripe')) {
        return errorResponse(
          `Stripe error: ${handlerError.message}`,
          400,
          {
            code: handlerError.code,
            type: handlerError.type,
            param: handlerError.param
          }
        );
      }

      // Check if it's a database error
      if (handlerError.message && handlerError.message.includes('database')) {
        return errorResponse(
          'Database operation failed',
          500,
          { originalError: handlerError.message }
        );
      }

      // Generic handler error
      return errorResponse(
        handlerError.message || 'An error occurred processing your request',
        500,
        { originalError: handlerError.message }
      );
    }

  } catch (error) {
    log('Unexpected function error', { 
      message: error.message, 
      stack: error.stack,
      name: error.name 
    });
    
    return errorResponse(
      'Internal server error',
      500,
      { 
        error: error.message,
        type: error.name
      }
    );
  }
});
