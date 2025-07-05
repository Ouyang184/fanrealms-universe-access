
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Enhanced logging function with timestamps and step tracking
const logStep = (step: string, data?: any, level: 'INFO' | 'ERROR' | 'DEBUG' = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [COMMISSION-PAYMENT-INTENT]`;
  
  if (data) {
    console.log(`${prefix} ${step}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${step}`);
  }
};

// Environment validation function
const validateEnvironment = () => {
  const requiredVars = {
    STRIPE_SECRET_KEY_TEST: Deno.env.get('STRIPE_SECRET_KEY_TEST'),
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
    SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  logStep('Environment validation passed', {
    hasStripeKey: !!requiredVars.STRIPE_SECRET_KEY_TEST,
    hasSupabaseUrl: !!requiredVars.SUPABASE_URL,
    hasAnonKey: !!requiredVars.SUPABASE_ANON_KEY,
    hasServiceKey: !!requiredVars.SUPABASE_SERVICE_ROLE_KEY,
  });

  return requiredVars;
};

// Test Stripe connection
const testStripeConnection = async (stripe: Stripe) => {
  try {
    logStep('Testing Stripe API connection');
    const account = await stripe.accounts.retrieve();
    logStep('Stripe connection successful', {
      accountId: account.id,
      country: account.country,
      testMode: !account.livemode
    });
    return true;
  } catch (error) {
    logStep('Stripe connection failed', { error: error.message }, 'ERROR');
    throw new Error(`Stripe API connection failed: ${error.message}`);
  }
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  logStep(`=== REQUEST START (ID: ${requestId}) ===`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logStep('Handling CORS preflight request');
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Step 1: Validate environment variables
    logStep('Step 1: Validating environment variables');
    const env = validateEnvironment();

    // Step 2: Parse request body with detailed logging
    logStep('Step 2: Parsing request body');
    let requestBody;
    try {
      const rawBody = await req.text();
      logStep('Raw request body received', { bodyLength: rawBody.length });
      requestBody = JSON.parse(rawBody);
      logStep('Request body parsed successfully', { 
        keys: Object.keys(requestBody),
        commissionId: requestBody.commissionId,
        amount: requestBody.amount 
      });
    } catch (parseError) {
      logStep('Failed to parse request body', { error: parseError.message }, 'ERROR');
      throw new Error(`Invalid request body: ${parseError.message}`);
    }

    const { commissionId, amount } = requestBody;

    if (!commissionId) {
      logStep('Missing commission ID', {}, 'ERROR');
      throw new Error('Commission ID is required');
    }

    // Step 3: Initialize Stripe with comprehensive testing
    logStep('Step 3: Initializing Stripe with TEST mode');
    const stripe = new Stripe(env.STRIPE_SECRET_KEY_TEST, {
      apiVersion: '2023-10-16',
    });

    // Test Stripe connection
    await testStripeConnection(stripe);

    // Step 4: Initialize Supabase clients
    logStep('Step 4: Initializing Supabase clients');
    const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const supabaseService = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Step 5: Authenticate user with detailed logging
    logStep('Step 5: Authenticating user');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('No authorization header provided', {}, 'ERROR');
      throw new Error('Authorization header is required');
    }

    logStep('Authorization header found, extracting token');
    const token = authHeader.replace('Bearer ', '');
    
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError) {
        logStep('Authentication failed', { error: authError.message }, 'ERROR');
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!authUser) {
        logStep('No user returned from authentication', {}, 'ERROR');
        throw new Error('Authentication required - no user found');
      }
      
      user = authUser;
      logStep('User authenticated successfully', { 
        userId: user.id,
        email: user.email,
        hasEmail: !!user.email 
      });
    } catch (authError) {
      logStep('Error during authentication', { error: authError.message }, 'ERROR');
      throw new Error(`Authentication error: ${authError.message}`);
    }

    // Step 6: Fetch commission request with comprehensive error handling
    logStep('Step 6: Fetching commission request details', { commissionId, userId: user.id });
    let commissionRequest;
    try {
      const { data, error: commissionError } = await supabaseService
        .from('commission_requests')
        .select(`
          *,
          commission_type:commission_types(name, description),
          creator:creators!commission_requests_creator_id_fkey(
            display_name,
            user_id
          )
        `)
        .eq('id', commissionId)
        .eq('customer_id', user.id)
        .single();

      if (commissionError) {
        logStep('Commission request query error', { 
          error: commissionError.message,
          code: commissionError.code,
          hint: commissionError.hint 
        }, 'ERROR');
        throw new Error(`Database query failed: ${commissionError.message}`);
      }

      if (!data) {
        logStep('No commission request found', { commissionId, userId: user.id }, 'ERROR');
        throw new Error('Commission request not found or not accessible');
      }

      commissionRequest = data;
      logStep('Commission request found', {
        id: commissionRequest.id,
        title: commissionRequest.title,
        agreed_price: commissionRequest.agreed_price,
        status: commissionRequest.status,
        stripe_payment_intent_id: commissionRequest.stripe_payment_intent_id,
        customer_id: commissionRequest.customer_id,
        creator_id: commissionRequest.creator_id
      });
    } catch (dbError) {
      logStep('Database operation failed', { error: dbError.message }, 'ERROR');
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Step 7: Validate commission status and pricing
    logStep('Step 7: Validating commission status and pricing');
    const validStatuses = ['pending', 'checkout_created', 'payment_pending', 'payment_failed'];
    if (!validStatuses.includes(commissionRequest.status)) {
      logStep('Commission request in wrong status', { 
        currentStatus: commissionRequest.status,
        validStatuses 
      }, 'ERROR');
      throw new Error(`Commission is in ${commissionRequest.status} status and cannot be paid`);
    }

    if (!commissionRequest.agreed_price) {
      logStep('No agreed price set', {}, 'ERROR');
      throw new Error('No agreed price set for this commission');
    }

    const amountInCents = Math.round(commissionRequest.agreed_price * 100);
    logStep('Price validation passed', {
      agreedPrice: commissionRequest.agreed_price,
      amountInCents
    });

    // Step 8: Handle existing payment intent if present
    logStep('Step 8: Checking for existing payment intent');
    let existingPaymentIntent = null;
    if (commissionRequest.stripe_payment_intent_id) {
      try {
        logStep('Retrieving existing payment intent', { 
          paymentIntentId: commissionRequest.stripe_payment_intent_id 
        });
        existingPaymentIntent = await stripe.paymentIntents.retrieve(commissionRequest.stripe_payment_intent_id);
        logStep('Existing payment intent retrieved', { 
          status: existingPaymentIntent.status,
          amount: existingPaymentIntent.amount 
        });
        
        // If existing payment intent is still usable, return it
        const reusableStatuses = ['requires_payment_method', 'requires_confirmation', 'requires_action'];
        if (reusableStatuses.includes(existingPaymentIntent.status)) {
          logStep('Reusing existing payment intent (TEST MODE)');
          return new Response(JSON.stringify({ 
            client_secret: existingPaymentIntent.client_secret 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        logStep('Existing payment intent not reusable', { 
          status: existingPaymentIntent.status 
        });
      } catch (stripeError) {
        logStep('Could not retrieve existing payment intent', { 
          error: stripeError.message 
        }, 'ERROR');
      }
    }

    // Step 9: Handle Stripe customer
    logStep('Step 9: Managing Stripe customer');
    let customerId_stripe;
    try {
      const customers = await stripe.customers.list({ 
        email: user.email,
        limit: 1 
      });

      if (customers.data.length > 0) {
        customerId_stripe = customers.data[0].id;
        logStep('Found existing Stripe customer (TEST MODE)', { customerId: customerId_stripe });
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
            environment: 'test'
          }
        });
        customerId_stripe = customer.id;
        logStep('Created new Stripe customer (TEST MODE)', { customerId: customerId_stripe });
      }
    } catch (stripeError) {
      logStep('Stripe customer operation failed (TEST MODE)', { 
        error: stripeError.message 
      }, 'ERROR');
      throw new Error(`Stripe customer error: ${stripeError.message}`);
    }

    // Step 10: Create payment intent
    logStep('Step 10: Creating new payment intent (TEST MODE)');
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        customer: customerId_stripe,
        capture_method: 'manual', // This is key - authorizes but doesn't capture
        description: `Commission: ${commissionRequest.title}`,
        metadata: {
          commission_request_id: commissionId,
          customer_id: user.id,
          creator_id: commissionRequest.creator_id,
          type: 'commission_payment',
          environment: 'test'
        }
      });

      logStep('Created payment intent (TEST MODE)', { 
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        captureMethod: paymentIntent.capture_method
      });
    } catch (stripeError) {
      logStep('Payment intent creation failed (TEST MODE)', { 
        error: stripeError.message 
      }, 'ERROR');
      throw new Error(`Payment intent error: ${stripeError.message}`);
    }

    // Step 11: Update commission request
    logStep('Step 11: Updating commission request with payment intent');
    try {
      const { error: updateError } = await supabaseService
        .from('commission_requests')
        .update({ 
          stripe_payment_intent_id: paymentIntent.id,
          status: 'payment_pending',
          creator_notes: 'Payment authorized - funds held pending creator approval (TEST MODE)'
        })
        .eq('id', commissionId);

      if (updateError) {
        logStep('Failed to update commission request', { 
          error: updateError.message 
        }, 'ERROR');
        
        // Cancel the payment intent if database update fails
        try {
          await stripe.paymentIntents.cancel(paymentIntent.id);
          logStep('Payment intent cancelled due to database update failure (TEST MODE)');
        } catch (cancelError) {
          logStep('Failed to cancel payment intent (TEST MODE)', { 
            error: cancelError.message 
          }, 'ERROR');
        }
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      logStep('Updated commission request status to payment_pending (TEST MODE)');
    } catch (updateError) {
      logStep('Commission request update failed (TEST MODE)', { 
        error: updateError.message 
      }, 'ERROR');
      throw new Error(`Update error: ${updateError.message}`);
    }

    // Step 12: Success response
    logStep('=== SUCCESS: Returning client secret (TEST MODE) ===', {
      requestId,
      paymentIntentId: paymentIntent.id,
      commissionId,
      userId: user.id
    });

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret,
      debug_info: {
        request_id: requestId,
        payment_intent_id: paymentIntent.id,
        commission_id: commissionId,
        environment: 'test'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logStep('=== ERROR IN CREATE COMMISSION PAYMENT INTENT (TEST MODE) ===', {
      requestId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    }, 'ERROR');
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      debug_info: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        environment: 'test'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
