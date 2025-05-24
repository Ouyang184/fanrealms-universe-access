
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      creators: {
        Row: {
          id: string
          user_id: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          stripe_charges_enabled: boolean | null
          stripe_payouts_enabled: boolean | null
        }
        Insert: {
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_charges_enabled?: boolean | null
          stripe_payouts_enabled?: boolean | null
        }
        Update: {
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          stripe_charges_enabled?: boolean | null
          stripe_payouts_enabled?: boolean | null
        }
      }
      creator_subscriptions: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          tier_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          amount_paid: number | null
          platform_fee: number | null
          creator_earnings: number | null
        }
        Insert: {
          user_id: string
          creator_id: string
          tier_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          amount_paid?: number | null
          platform_fee?: number | null
          creator_earnings?: number | null
        }
        Update: {
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          amount_paid?: number | null
          platform_fee?: number | null
          creator_earnings?: number | null
        }
      }
      creator_earnings: {
        Insert: {
          creator_id: string
          subscription_id?: string | null
          amount: number
          platform_fee: number
          net_amount: number
          stripe_transfer_id?: string | null
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      console.error('No Stripe signature found')
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe configuration')
      return new Response('Configuration error', { status: 500 })
    }

    // Verify webhook signature
    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
    let event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('Webhook event type:', event.type)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(supabase, event.data.object)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabase, stripe, event.data.object)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabase, event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function handleAccountUpdated(supabase: any, account: any) {
  console.log('Handling account updated:', account.id)
  
  const { error } = await supabase
    .from('creators')
    .update({
      stripe_onboarding_complete: account.details_submitted && account.charges_enabled,
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
    })
    .eq('stripe_account_id', account.id)

  if (error) {
    console.error('Error updating creator account:', error)
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('Handling subscription updated:', subscription.id)
  
  const { error } = await supabase
    .from('creator_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  console.log('Handling subscription deleted:', subscription.id)
  
  const { error } = await supabase
    .from('creator_subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error canceling subscription:', error)
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, stripe: any, invoice: any) {
  console.log('Handling invoice payment succeeded:', invoice.id)
  
  const subscriptionId = invoice.subscription
  const amountPaid = invoice.amount_paid / 100 // Convert from cents
  const platformFee = amountPaid * 0.05 // 5% platform fee
  const creatorEarnings = amountPaid - platformFee

  // Update subscription with payment details
  const { data: subscription, error: subError } = await supabase
    .from('creator_subscriptions')
    .update({
      amount_paid: amountPaid,
      platform_fee: platformFee,
      creator_earnings: creatorEarnings,
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select('creator_id')
    .single()

  if (subError) {
    console.error('Error updating subscription payment:', subError)
    return
  }

  // Record creator earnings
  const { error: earningsError } = await supabase
    .from('creator_earnings')
    .insert({
      creator_id: subscription.creator_id,
      amount: amountPaid,
      platform_fee: platformFee,
      net_amount: creatorEarnings,
    })

  if (earningsError) {
    console.error('Error recording creator earnings:', earningsError)
  }
}

async function handlePaymentIntentSucceeded(supabase: any, paymentIntent: any) {
  console.log('Handling payment intent succeeded:', paymentIntent.id)
  // Additional handling for one-time payments if needed
}
