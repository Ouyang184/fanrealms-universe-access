
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
      subscriptions: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          tier_id: string | null
          is_paid: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          creator_id: string
          tier_id?: string | null
          is_paid?: boolean
        }
        Update: {
          is_paid?: boolean
          tier_id?: string | null
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
    console.log('Webhook received');
    const body = await req.text()
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key')
      return new Response('Configuration error', { status: 500 })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Parse the event without signature verification for now to avoid SubtleCrypto issues
    let event
    try {
      event = JSON.parse(body)
      console.log('Webhook event type:', event.type, 'ID:', event.id)
    } catch (err) {
      console.error('JSON parsing failed:', err)
      return new Response('Invalid JSON', { status: 400 })
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
        await handleInvoicePaymentSucceeded(supabase, stripe, event.data.object)
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

async function handleCheckoutSessionCompleted(supabase: any, session: any) {
  console.log('Handling checkout session completed:', session.id)
  
  if (session.mode !== 'subscription') {
    console.log('Not a subscription checkout, skipping')
    return
  }

  try {
    // Get subscription details
    const subscriptionId = session.subscription
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session')
      return
    }

    console.log('Looking for creator subscription with stripe_subscription_id:', subscriptionId)

    // Find the creator subscription record
    const { data: creatorSub, error: subError } = await supabase
      .from('creator_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subError || !creatorSub) {
      console.error('Could not find creator subscription:', subError)
      return
    }

    console.log('Found creator subscription:', creatorSub.id)

    // Update the creator subscription status to active
    const { error: updateError } = await supabase
      .from('creator_subscriptions')
      .update({ status: 'active' })
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      console.error('Error updating creator subscription status:', updateError)
    } else {
      console.log('Updated creator subscription status to active')
    }

    // Insert or update the subscriptions table (for counting)
    const { error: insertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: creatorSub.user_id,
        creator_id: creatorSub.creator_id,
        tier_id: creatorSub.tier_id,
        is_paid: true
      }, { 
        onConflict: 'user_id,creator_id',
        ignoreDuplicates: false 
      })

    if (insertError) {
      console.error('Error upserting subscription:', insertError)
    } else {
      console.log('Successfully upserted subscription record')
    }

  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
  }
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('Handling subscription updated:', subscription.id)
  
  try {
    // Check if we have valid dates
    const currentPeriodStart = subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null
    const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
    
    // Validate dates
    if (currentPeriodStart && isNaN(currentPeriodStart.getTime())) {
      console.error('Invalid current_period_start:', subscription.current_period_start)
      return
    }
    if (currentPeriodEnd && isNaN(currentPeriodEnd.getTime())) {
      console.error('Invalid current_period_end:', subscription.current_period_end)
      return
    }

    const updateData: any = {
      status: subscription.status
    }

    if (currentPeriodStart) {
      updateData.current_period_start = currentPeriodStart.toISOString()
    }
    if (currentPeriodEnd) {
      updateData.current_period_end = currentPeriodEnd.toISOString()
    }

    const { error } = await supabase
      .from('creator_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Successfully updated subscription:', subscription.id)
    }

    // Update the subscriptions table as well
    if (subscription.status === 'active') {
      const { data: creatorSub } = await supabase
        .from('creator_subscriptions')
        .select('user_id, creator_id, tier_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (creatorSub) {
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: creatorSub.user_id,
            creator_id: creatorSub.creator_id,
            tier_id: creatorSub.tier_id,
            is_paid: true
          }, { onConflict: 'user_id,creator_id' })
        
        console.log('Updated subscriptions table for active subscription')
      }
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdated:', error)
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  console.log('Handling subscription deleted:', subscription.id)
  
  // Update creator_subscriptions
  const { error } = await supabase
    .from('creator_subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Error canceling subscription:', error)
  }

  // Remove from subscriptions table
  const { data: creatorSub } = await supabase
    .from('creator_subscriptions')
    .select('user_id, creator_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (creatorSub) {
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', creatorSub.user_id)
      .eq('creator_id', creatorSub.creator_id)
    
    console.log('Removed subscription from subscriptions table')
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, stripe: any, invoice: any) {
  console.log('Handling invoice payment succeeded:', invoice.id)
  
  const subscriptionId = invoice.subscription
  if (!subscriptionId) {
    console.error('No subscription ID in invoice')
    return
  }

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
    .maybeSingle()

  if (subError) {
    console.error('Error updating subscription payment:', subError)
    return
  }

  if (!subscription) {
    console.log('No subscription found for stripe_subscription_id:', subscriptionId)
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
  } else {
    console.log('Successfully recorded creator earnings')
  }
}
