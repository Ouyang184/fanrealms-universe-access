import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createJsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
};

// Authentication function
async function authenticateUser(req: Request, supabase: any) {
  console.log('[Auth] Starting authentication...');
  
  try {
    const authHeader = req.headers.get('Authorization');
    console.log('[Auth] Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[Auth] No authorization header provided');
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Auth] Extracted token length:', token.length);
    
    console.log('[Auth] Calling supabase.auth.getUser...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('[Auth] Auth response:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      hasError: !!error,
      errorMessage: error?.message 
    });
    
    if (error || !user) {
      console.error('[Auth] Authentication error:', error);
      throw new Error(`Authentication failed: ${error?.message || 'User not found'}`);
    }

    console.log('[Auth] Authentication successful for user:', user.id);
    return user;
  } catch (authError) {
    console.error('[Auth] CRITICAL AUTH ERROR:', authError);
    console.error('[Auth] Error type:', authError.constructor?.name);
    console.error('[Auth] Error message:', authError.message);
    throw authError;
  }
}

// Stripe customer service
async function getOrCreateStripeCustomer(stripe: any, supabase: any, user: any) {
  console.log('Getting or creating Stripe customer for user:', user.id);
  
  // Check if customer already exists in our database
  const { data: existingCustomer, error: fetchError } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (existingCustomer && !fetchError) {
    console.log('Found existing Stripe customer:', existingCustomer.stripe_customer_id);
    return existingCustomer.stripe_customer_id;
  }

  // Check if customer exists in Stripe by email
  const customers = await stripe.customers.list({
    email: user.email,
    limit: 1
  });

  let customerId;
  
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
    console.log('Found existing customer in Stripe:', customerId);
  } else {
    // Create new customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id
      }
    });
    customerId = customer.id;
    console.log('Created new Stripe customer:', customerId);
  }

  // Store the customer ID in our database
  const { error: insertError } = await supabase
    .from('stripe_customers')
    .upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (insertError) {
    console.error('Error storing customer ID:', insertError);
    // Don't throw error, just log it - the customer ID still works
  }

  return customerId;
}

// Create subscription handler
async function handleCreateSubscription(stripe: any, supabase: any, user: any, body: any) {
  console.log('[CreateSubscription] === STARTING SUBSCRIPTION CREATION ===');
  console.log('[CreateSubscription] User ID:', user.id);
  console.log('[CreateSubscription] User email:', user.email);
  console.log('[CreateSubscription] Request body:', JSON.stringify(body, null, 2));

  // Extract parameters from body - handle both formats
  const tierId = body.tierId || body.tier_id;
  const creatorId = body.creatorId || body.creator_id;

  console.log('[CreateSubscription] Extracted params:', { tierId, creatorId });

  if (!tierId || !creatorId) {
    console.log('ERROR: Missing tierId or creatorId', { tierId, creatorId });
    return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
  }

  try {
    // Get tier details
    console.log('Fetching tier and creator details...');
    const { data: tier, error: tierError } = await supabase
      .from('membership_tiers')
      .select(`
        *,
        creators!inner(
          stripe_account_id,
          display_name
        )
      `)
      .eq('id', tierId)
      .single();

    if (tierError || !tier) {
      console.log('ERROR: Tier not found:', tierError);
      return createJsonResponse({ error: 'Membership tier not found' }, 404);
    }

    console.log('Tier found:', tier.title, 'Price:', tier.price);

    if (!tier.creators.stripe_account_id) {
      console.log('ERROR: Creator not connected to Stripe');
      return createJsonResponse({ 
        error: 'This creator has not set up payments yet. Please try again later.' 
      }, 400);
    }

    // Create or get Stripe customer
    console.log('Creating/getting Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabase, user);
    console.log('Stripe customer ID:', stripeCustomerId);

    // Create Payment Intent
    console.log('Creating Payment Intent for amount:', tier.price);
    const targetAmount = Math.round(tier.price * 100); // Convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeCustomerId,
      amount: targetAmount,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        tier_name: tier.title,
        creator_name: tier.creators.display_name,
        type: 'subscription_setup',
        full_tier_price: tier.price.toString(),
        platform_fee_percent: '4'
      },
      setup_future_usage: 'off_session',
    });

    console.log('Payment Intent created:', paymentIntent.id);

    return createJsonResponse({
      clientSecret: paymentIntent.client_secret,
      amount: targetAmount,
      tierName: tier.title,
      tierId: tierId,
      creatorId: creatorId,
      paymentIntentId: paymentIntent.id,
      useCustomPaymentPage: true,
      fullTierPrice: targetAmount,
      reusedSession: false
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}

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

      default:
        console.log('[StripeSubscriptions] ERROR: Invalid action provided:', action);
        return createJsonResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    console.error('[StripeSubscriptions] === CRITICAL ERROR OCCURRED ===');
    console.error('[StripeSubscriptions] Error type:', error.constructor.name);
    console.error('[StripeSubscriptions] Error message:', error.message);
    console.error('[StripeSubscriptions] Error stack:', error.stack);
    
    // Detailed error analysis with enhanced logging
    if (error.message?.includes('JSON')) {
      console.error('[StripeSubscriptions] JSON parsing error - malformed request body');
      return createJsonResponse({ 
        error: 'Invalid request format',
        details: 'Request body must be valid JSON'
      }, 400);
    }
    
    if (error.message?.includes('Authentication') || error.message?.includes('Authorization')) {
      console.error('[StripeSubscriptions] Authentication error detected');
      return createJsonResponse({ 
        error: 'Authentication failed - please log in again',
        details: error.message
      }, 401);
    }
    
    if (error.message?.includes('Stripe') || error.type) {
      console.error('[StripeSubscriptions] Stripe API error detected');
      return createJsonResponse({ 
        error: 'Payment service error',
        details: error.message
      }, 402);
    }
    
    // Generic server error with full details
    console.error('[StripeSubscriptions] Unhandled server error');
    return createJsonResponse({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : 'No stack trace available',
      errorType: error.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    }, 500);
  }
});