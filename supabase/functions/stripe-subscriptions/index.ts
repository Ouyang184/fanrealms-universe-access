
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Missing authorization', { status: 401 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { action, tierId, creatorId } = await req.json()
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      return new Response('Missing Stripe configuration', { status: 500 })
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (action === 'create_subscription') {
      // Get tier and creator details
      const { data: tier, error: tierError } = await supabase
        .from('membership_tiers')
        .select('*, creators!inner(stripe_account_id)')
        .eq('id', tierId)
        .single()

      if (tierError || !tier) {
        return new Response('Tier not found', { status: 404 })
      }

      if (!tier.creators.stripe_account_id) {
        return new Response('Creator not connected to Stripe', { status: 400 })
      }

      // Create or get Stripe customer
      let stripeCustomerId
      const { data: existingCustomer } = await supabaseService
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single()

      if (existingCustomer) {
        stripeCustomerId = existingCustomer.stripe_customer_id
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
          },
        })
        stripeCustomerId = customer.id

        // Store customer in database
        await supabaseService
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            stripe_customer_id: stripeCustomerId,
          })
      }

      // Create Stripe price if it doesn't exist
      let stripePriceId = tier.stripe_price_id
      if (!stripePriceId) {
        const price = await stripe.prices.create({
          unit_amount: Math.round(tier.price * 100), // Convert to cents
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: {
            name: tier.title,
            description: tier.description,
          },
        })
        stripePriceId = price.id

        // Update tier with price ID
        await supabaseService
          .from('membership_tiers')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', tierId)
      }

      // Calculate application fee (5% platform fee)
      const applicationFee = Math.round(tier.price * 100 * 0.05)

      // Create subscription with destination charge
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

      // Store subscription in database
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

      return new Response(JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (action === 'cancel_subscription') {
      const { subscriptionId } = await req.json()

      // Verify user owns this subscription
      const { data: subscription } = await supabase
        .from('creator_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .eq('id', subscriptionId)
        .single()

      if (!subscription) {
        return new Response('Subscription not found', { status: 404 })
      }

      // Cancel Stripe subscription
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response('Invalid action', { status: 400 })

  } catch (error) {
    console.error('Subscription error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
