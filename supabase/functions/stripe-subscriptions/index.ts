
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Stripe subscriptions function called');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('ERROR: Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Authorization header found');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    console.log('Supabase client created');

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('ERROR: User authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.id);

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', requestBody);
    } catch (parseError) {
      console.log('ERROR: Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, tierId, creatorId } = requestBody;
    console.log('Action:', action, 'TierID:', tierId, 'CreatorID:', creatorId);

    if (!action) {
      console.log('ERROR: Missing action in request');
      return new Response(JSON.stringify({ error: 'Missing action parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      console.log('ERROR: Missing Stripe secret key');
      return new Response(JSON.stringify({ error: 'Missing Stripe configuration' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Stripe secret key found');

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (action === 'create_subscription') {
      console.log('Creating subscription for tier:', tierId, 'creator:', creatorId);

      if (!tierId || !creatorId) {
        console.log('ERROR: Missing tierId or creatorId');
        return new Response(JSON.stringify({ error: 'Missing tierId or creatorId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get tier and creator details
      console.log('Fetching tier details...');
      const { data: tier, error: tierError } = await supabase
        .from('membership_tiers')
        .select('*, creators!inner(stripe_account_id)')
        .eq('id', tierId)
        .single()

      if (tierError || !tier) {
        console.log('ERROR: Tier not found:', tierError);
        return new Response(JSON.stringify({ error: 'Tier not found' }), { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Tier found:', tier);

      if (!tier.creators.stripe_account_id) {
        console.log('ERROR: Creator not connected to Stripe');
        return new Response(JSON.stringify({ error: 'Creator not connected to Stripe' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Creator has Stripe account:', tier.creators.stripe_account_id);

      // Create or get Stripe customer
      console.log('Checking for existing Stripe customer...');
      let stripeCustomerId
      const { data: existingCustomer } = await supabaseService
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single()

      if (existingCustomer) {
        stripeCustomerId = existingCustomer.stripe_customer_id
        console.log('Found existing customer:', stripeCustomerId);
      } else {
        console.log('Creating new Stripe customer...');
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        })
        stripeCustomerId = customer.id
        console.log('Created new customer:', stripeCustomerId);

        // Store customer in database
        await supabaseService
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            stripe_customer_id: stripeCustomerId,
          })
      }

      // Create Stripe price if it doesn't exist
      console.log('Checking Stripe price...');
      let stripePriceId = tier.stripe_price_id
      if (!stripePriceId) {
        console.log('Creating new Stripe price...');
        const price = await stripe.prices.create({
          unit_amount: Math.round(tier.price * 100), // Convert to cents
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: {
            name: tier.title,
            // Removed description - it's not a valid parameter here
          },
        })
        stripePriceId = price.id
        console.log('Created price:', stripePriceId);

        // Update tier with price ID
        await supabaseService
          .from('membership_tiers')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', tierId)
      }

      console.log('Using price ID:', stripePriceId);

      // Calculate application fee (5% platform fee)
      const applicationFee = Math.round(tier.price * 100 * 0.05)

      // Create subscription with destination charge
      console.log('Creating Stripe subscription...');
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        application_fee_percent: 5,
        transfer_data: {
          destination: tier.creators.stripe_account_id,
        },
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      })

      console.log('Subscription created:', subscription.id);

      // Store subscription in database
      console.log('Storing subscription in database...');
      await supabaseService
        .from('creator_subscriptions')
        .insert({
          user_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomerId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })

      console.log('Subscription stored in database');

      return new Response(JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (action === 'cancel_subscription') {
      const { subscriptionId } = requestBody;

      console.log('Cancelling subscription:', subscriptionId);

      // Verify user owns this subscription
      const { data: subscription } = await supabase
        .from('creator_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .eq('id', subscriptionId)
        .single()

      if (!subscription) {
        console.log('ERROR: Subscription not found for user');
        return new Response(JSON.stringify({ error: 'Subscription not found' }), { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Cancel Stripe subscription
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

      console.log('Subscription cancelled successfully');

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('ERROR: Invalid action:', action);
    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Subscription error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
