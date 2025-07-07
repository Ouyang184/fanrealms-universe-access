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

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

// Authentication function
async function authenticateUser(req: Request, supabase: any) {
  logStep('Starting authentication...');
  
  try {
    const authHeader = req.headers.get('Authorization');
    logStep('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    logStep('Extracted token length:', token.length);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    logStep('Auth response:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      hasError: !!error,
      errorMessage: error?.message 
    });
    
    if (error || !user) {
      throw new Error(`Authentication failed: ${error?.message || 'User not found'}`);
    }

    logStep('Authentication successful for user:', user.id);
    return user;
  } catch (authError) {
    logStep('Authentication error:', authError.message);
    throw authError;
  }
}

// Get or create Stripe customer
async function getOrCreateStripeCustomer(stripe: any, supabase: any, user: any) {
  logStep('Getting or creating Stripe customer for user:', user.id);
  
  // Check if customer already exists in our database
  const { data: existingCustomer, error: fetchError } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (existingCustomer && !fetchError) {
    logStep('Found existing Stripe customer:', existingCustomer.stripe_customer_id);
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
    logStep('Found existing customer in Stripe:', customerId);
  } else {
    // Create new customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        user_id: user.id
      }
    });
    customerId = customer.id;
    logStep('Created new Stripe customer:', customerId);
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
    logStep('Error storing customer ID:', insertError);
  }

  return customerId;
}

// Create subscription handler
async function handleCreateSubscription(stripe: any, supabase: any, user: any, body: any) {
  logStep('Starting subscription creation', { userId: user.id, body });

  const tierId = body.tierId || body.tier_id;
  const creatorId = body.creatorId || body.creator_id;

  if (!tierId || !creatorId) {
    return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
  }

  try {
    // Get tier details
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
      return createJsonResponse({ error: 'Membership tier not found' }, 404);
    }

    if (!tier.creators.stripe_account_id) {
      return createJsonResponse({ 
        error: 'This creator has not set up payments yet. Please try again later.' 
      }, 400);
    }

    // Create or get Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabase, user);

    // Create Payment Intent
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
        type: 'subscription_setup'
      },
      setup_future_usage: 'off_session',
    });

    logStep('Payment Intent created:', paymentIntent.id);

    return createJsonResponse({
      clientSecret: paymentIntent.client_secret,
      amount: targetAmount,
      tierName: tier.title,
      tierId: tierId,
      creatorId: creatorId,
      paymentIntentId: paymentIntent.id,
      useCustomPaymentPage: true
    });

  } catch (error) {
    logStep('Error in create subscription:', error.message);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}

serve(async (req) => {
  logStep('=== NEW REQUEST RECEIVED ===', { method: req.method, url: req.url });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { action } = body;
    
    logStep('Action received:', action);

    // Check environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE') || Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeSecretKey) {
      logStep('ERROR: No Stripe secret key found');
      return createJsonResponse({ error: 'Stripe configuration missing' }, 500);
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep('ERROR: Missing Supabase configuration');
      return createJsonResponse({ error: 'Supabase configuration missing' }, 500);
    }

    // Initialize clients
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const user = await authenticateUser(req, supabaseService);

    // Route to action handler
    switch (action) {
      case 'create_subscription':
        return await handleCreateSubscription(stripe, supabaseService, user, body);
      default:
        return createJsonResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    logStep('CRITICAL ERROR:', error.message);
    
    if (error.message?.includes('Authentication')) {
      return createJsonResponse({ 
        error: 'Authentication failed - please log in again' 
      }, 401);
    }
    
    return createJsonResponse({ 
      error: error.message || 'An unexpected error occurred'
    }, 500);
  }
});