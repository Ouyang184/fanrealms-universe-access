
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
    console.log('=== WEBHOOK EVENT RECEIVED ===');
    const body = await req.text()
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key')
      return new Response('Configuration error', { status: 500 })
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    // Parse the event
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
        console.log('=== PROCESSING CHECKOUT SESSION COMPLETED ===');
        await handleCheckoutSessionCompleted(supabase, event.data.object)
        break
      
      case 'customer.subscription.created':
        console.log('=== PROCESSING SUBSCRIPTION CREATED ===');
        await handleSubscriptionCreatedOrUpdated(supabase, event.data.object)
        break
      
      case 'customer.subscription.updated':
        console.log('=== PROCESSING SUBSCRIPTION UPDATED ===');
        await handleSubscriptionCreatedOrUpdated(supabase, event.data.object)
        break
      
      case 'customer.subscription.deleted':
        console.log('=== PROCESSING SUBSCRIPTION DELETED ===');
        await handleSubscriptionDeleted(supabase, event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        console.log('=== PROCESSING INVOICE PAYMENT SUCCEEDED ===');
        const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeSecretKey)
        await handleInvoicePaymentSucceeded(supabase, stripe, event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('=== WEBHOOK ERROR ===', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function handleCheckoutSessionCompleted(supabase: any, session: any) {
  console.log('Processing checkout session completed:', session.id)
  
  if (session.mode !== 'subscription') {
    console.log('Not a subscription checkout, skipping')
    return
  }

  try {
    const subscriptionId = session.subscription
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session')
      return
    }

    console.log('Looking for subscription record with stripe_subscription_id:', subscriptionId)

    // Find the creator subscription record
    const { data: creatorSub, error: subError } = await supabase
      .from('creator_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (subError) {
      console.error('Error finding creator subscription:', subError)
      return
    }

    if (!creatorSub) {
      console.error('Could not find creator subscription for stripe_subscription_id:', subscriptionId)
      return
    }

    console.log('Found creator subscription:', creatorSub.id, 'updating to active')

    // Update creator subscription to active
    const { error: updateError } = await supabase
      .from('creator_subscriptions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      console.error('Error updating creator subscription:', updateError)
      return
    }

    console.log('Successfully updated creator subscription to active')

    // Also ensure entry in subscriptions table for counting
    const { error: insertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: creatorSub.user_id,
        creator_id: creatorSub.creator_id,
        tier_id: creatorSub.tier_id,
        is_paid: true,
        created_at: new Date().toISOString()
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

async function handleSubscriptionCreatedOrUpdated(supabase: any, subscription: any) {
  console.log('Processing subscription created/updated:', subscription.id, 'status:', subscription.status)
  
  try {
    // Validate and convert timestamps
    const currentPeriodStart = subscription.current_period_start ? 
      new Date(subscription.current_period_start * 1000).toISOString() : null
    const currentPeriodEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null

    console.log('Updating subscription periods:', { currentPeriodStart, currentPeriodEnd })

    const updateData: any = {
      status: subscription.status,
      updated_at: new Date().toISOString()
    }

    if (currentPeriodStart) {
      updateData.current_period_start = currentPeriodStart
    }
    if (currentPeriodEnd) {
      updateData.current_period_end = currentPeriodEnd
    }

    const { data: updatedSub, error } = await supabase
      .from('creator_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', subscription.id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating creator subscription:', error)
      return
    }

    if (!updatedSub) {
      console.log('No creator subscription found for stripe_subscription_id:', subscription.id)
      return
    }

    console.log('Successfully updated creator subscription:', subscription.id, 'to status:', subscription.status)

    // Update the subscriptions table based on status
    if (subscription.status === 'active') {
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: updatedSub.user_id,
          creator_id: updatedSub.creator_id,
          tier_id: updatedSub.tier_id,
          is_paid: true,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id,creator_id' })
      
      if (upsertError) {
        console.error('Error upserting active subscription:', upsertError)
      } else {
        console.log('Updated subscriptions table for active subscription')
      }
    } else if (['canceled', 'incomplete', 'past_due', 'unpaid'].includes(subscription.status)) {
      // Remove from subscriptions table for inactive statuses
      const { error: deleteError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', updatedSub.user_id)
        .eq('creator_id', updatedSub.creator_id)
      
      if (deleteError) {
        console.error('Error removing inactive subscription:', deleteError)
      } else {
        console.log('Removed subscription from subscriptions table for status:', subscription.status)
      }
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCreatedOrUpdated:', error)
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  console.log('Processing subscription deleted:', subscription.id)
  
  try {
    // Update creator_subscriptions
    const { data: canceledSub, error } = await supabase
      .from('creator_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
      .select('user_id, creator_id')
      .single()

    if (error) {
      console.error('Error canceling creator subscription:', error)
      return
    }

    if (!canceledSub) {
      console.log('No creator subscription found to cancel for:', subscription.id)
      return
    }

    console.log('Successfully canceled creator subscription')

    // Remove from subscriptions table
    const { error: deleteError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', canceledSub.user_id)
      .eq('creator_id', canceledSub.creator_id)
    
    if (deleteError) {
      console.error('Error removing canceled subscription:', deleteError)
    } else {
      console.log('Removed canceled subscription from subscriptions table')
    }
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, stripe: any, invoice: any) {
  console.log('Processing invoice payment succeeded:', invoice.id)
  console.log('Invoice object details:', JSON.stringify(invoice, null, 2))
  
  let subscriptionId = invoice.subscription
  
  // If subscription ID is not directly available, try to get it from other locations
  if (!subscriptionId) {
    // Check in parent.subscription_details.subscription (this is where it actually is)
    if (invoice.parent?.subscription_details?.subscription) {
      subscriptionId = invoice.parent.subscription_details.subscription
      console.log('Found subscription ID in parent.subscription_details:', subscriptionId)
    }
    // Also check line items as fallback
    else if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0) {
      const lineItem = invoice.lines.data[0]
      if (lineItem.parent?.subscription_item_details?.subscription) {
        subscriptionId = lineItem.parent.subscription_item_details.subscription
        console.log('Found subscription ID in line item parent:', subscriptionId)
      }
    }
  }
  
  if (!subscriptionId) {
    console.error('No subscription ID found in invoice:', {
      invoiceId: invoice.id,
      subscription: invoice.subscription,
      parent: invoice.parent,
      lines: invoice.lines?.data?.map(line => ({ 
        id: line.id, 
        subscription: line.subscription,
        parent: line.parent 
      }))
    })
    return
  }

  console.log('Found subscription ID:', subscriptionId)

  try {
    const amountPaid = invoice.amount_paid / 100 // Convert from cents
    const platformFee = amountPaid * 0.05 // 5% platform fee
    const creatorEarnings = amountPaid - platformFee

    console.log('Payment details:', { amountPaid, platformFee, creatorEarnings })

    // Update subscription with payment details
    const { data: subscription, error: subError } = await supabase
      .from('creator_subscriptions')
      .update({
        amount_paid: amountPaid,
        platform_fee: platformFee,
        creator_earnings: creatorEarnings,
        status: 'active', // Ensure status is active on successful payment
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId)
      .select('creator_id, user_id, tier_id')
      .maybeSingle()

    if (subError) {
      console.error('Error updating subscription payment:', subError)
      return
    }

    if (!subscription) {
      console.log('No subscription found for stripe_subscription_id:', subscriptionId)
      return
    }

    console.log('Updated subscription payment details for:', subscription)

    // Also update the subscriptions table to ensure counting is correct
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: subscription.user_id,
        creator_id: subscription.creator_id,
        tier_id: subscription.tier_id,
        is_paid: true,
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,creator_id',
        ignoreDuplicates: false 
      })

    if (subscriptionsError) {
      console.error('Error upserting subscription for counting:', subscriptionsError)
    } else {
      console.log('Successfully updated subscriptions table for counting')
    }

    // Record creator earnings
    const { error: earningsError } = await supabase
      .from('creator_earnings')
      .insert({
        creator_id: subscription.creator_id,
        amount: amountPaid,
        platform_fee: platformFee,
        net_amount: creatorEarnings,
        created_at: new Date().toISOString()
      })

    if (earningsError) {
      console.error('Error recording creator earnings:', earningsError)
    } else {
      console.log('Successfully recorded creator earnings')
    }
  } catch (error) {
    console.error('Error in handleInvoicePaymentSucceeded:', error)
  }
}
