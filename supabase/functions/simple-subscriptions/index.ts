
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use LIVE Stripe keys
const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_LIVE') || ''
);

// Helper function for consistent logging
const log = (step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SimpleSubscriptions] ${step}`);
  if (data) {
    console.log(`[${timestamp}] [SimpleSubscriptions] Data:`, JSON.stringify(data, null, 2));
  }
};

// MAIN SERVE FUNCTION
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('Function started', { method: req.method, url: req.url });

    // Check if Stripe key exists
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE');
    if (!stripeKey) {
      log('ERROR: STRIPE_SECRET_KEY_LIVE not found');
      throw new Error('Stripe secret key not configured');
    }
    log('Stripe key found');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      log('ERROR: Missing Supabase environment variables');
      throw new Error('Supabase configuration missing');
    }
    log('Supabase config found');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      log('ERROR: No authorization header');
      throw new Error('Authorization header missing');
    }
    log('Auth header found');

    // Create clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    log('Getting authenticated user');
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError) {
      log('Auth error:', authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    if (!user) {
      log('ERROR: No user found');
      throw new Error('User not authenticated');
    }
    log('User authenticated', { userId: user.id, email: user.email });

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      log('Request body parsed', requestBody);
    } catch (parseError) {
      log('ERROR: Failed to parse request body', parseError);
      throw new Error('Invalid request body');
    }

    const { action, tierId, creatorId } = requestBody;
    log('Action:', action, 'TierId:', tierId, 'CreatorId:', creatorId);

    if (action === 'create_subscription') {
      // Basic validation
      if (!tierId || !creatorId) {
        log('ERROR: Missing required fields');
        throw new Error('Missing tierId or creatorId');
      }

      // Check if tier exists
      log('Checking if tier exists');
      const { data: tier, error: tierError } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('id', tierId)
        .single();

      if (tierError) {
        log('ERROR: Tier query failed', tierError);
        throw new Error(`Failed to fetch tier: ${tierError.message}`);
      }

      if (!tier) {
        log('ERROR: Tier not found');
        throw new Error('Membership tier not found');
      }

      log('Tier found', { tierTitle: tier.title, tierPrice: tier.price });

      // Check if user already has subscription to this creator
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .single();

      if (existingSub) {
        log('User already has active subscription');
        return new Response(JSON.stringify({
          error: 'You already have an active subscription to this creator',
          shouldRefresh: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create or get Stripe customer
      log('Creating/getting Stripe customer');
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      let customerId;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        log('Found existing customer', { customerId });
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id
          }
        });
        customerId = customer.id;
        log('Created new customer', { customerId });
      }

      // Create Stripe checkout session
      log('Creating Stripe checkout session');
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tier.title} Subscription`,
              description: tier.description || `Monthly subscription to ${tier.title}`,
            },
            unit_amount: Math.round(tier.price * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${origin}/creator/${creatorId}?tab=membership&success=true`,
        cancel_url: `${origin}/creator/${creatorId}?tab=membership&canceled=true`,
        metadata: {
          user_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
        },
      });

      log('Checkout session created', { sessionId: session.id, url: session.url });

      // Return the checkout URL for redirect
      return new Response(JSON.stringify({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
        message: 'Redirecting to payment...'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default response for other actions
    return new Response(JSON.stringify({
      message: 'Function reached end',
      action: action
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log('ERROR (LIVE MODE):', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      debug: 'Check function logs for details'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
