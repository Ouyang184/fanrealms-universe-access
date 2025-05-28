
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOrCreateStripeCustomer, getOrCreateStripePrice } from '../services/stripe-customer.ts';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  supabaseService: any,
  user: any,
  tierId: string,
  creatorId: string
) {
  console.log('Creating subscription for user:', user.id, 'tier:', tierId, 'creator:', creatorId);

  if (!tierId || !creatorId) {
    console.log('ERROR: Missing tierId or creatorId');
    return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
  }

  // Check for existing active subscriptions ONLY in user_subscriptions table
  console.log('Checking for existing active subscriptions in user_subscriptions...');
  
  const { data: existingUserSub, error: userSubError } = await supabaseService
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('status', 'active')
    .maybeSingle();

  if (userSubError) {
    console.error('Error checking user_subscriptions:', userSubError);
  }

  if (existingUserSub) {
    console.log('Found existing active subscription in user_subscriptions');
    return createJsonResponse({ 
      error: 'You already have an active subscription to this tier.',
      shouldRefresh: true
    }, 200);
  }

  // Clean up old pending subscriptions (older than 1 hour) from user_subscriptions ONLY
  console.log('Cleaning up old pending subscriptions from user_subscriptions...');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  await supabaseService
    .from('user_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo);

  // Clean up ALL records from legacy subscriptions table
  console.log('Cleaning up legacy subscriptions table...');
  await supabaseService
    .from('subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId);

  // Get tier and creator details
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

  try {
    // Create or get Stripe customer
    console.log('Creating/getting Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
    console.log('Stripe customer ID:', stripeCustomerId);

    // Check if customer already has an active subscription to this tier in Stripe
    console.log('Checking Stripe for existing subscriptions...');
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 100,
    });

    // Check if any active subscription matches our tier
    for (const stripeSub of stripeSubscriptions.data) {
      if (stripeSub.metadata?.tier_id === tierId && stripeSub.metadata?.creator_id === creatorId) {
        console.log('Found existing Stripe subscription for this tier');
        
        // Ensure our database is in sync - store ONLY in user_subscriptions
        await supabaseService
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            creator_id: creatorId,
            tier_id: tierId,
            stripe_subscription_id: stripeSub.id,
            stripe_customer_id: stripeCustomerId,
            status: 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            amount: tier.price,
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id,creator_id,tier_id',
            ignoreDuplicates: false 
          });

        return createJsonResponse({ 
          error: 'You already have an active subscription to this tier.',
          shouldRefresh: true
        }, 200);
      }
    }

    // Create or get Stripe price
    console.log('Creating/getting Stripe price...');
    const stripePriceId = await getOrCreateStripePrice(stripe, supabaseService, tier, tierId);
    console.log('Stripe price ID:', stripePriceId);

    // Create Stripe subscription - ALWAYS requires payment
    console.log('Creating Stripe subscription...');
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
      application_fee_percent: 5,
      transfer_data: {
        destination: tier.creators.stripe_account_id,
      },
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card']
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        tier_name: tier.title,
        creator_name: tier.creators.display_name
      },
    });

    console.log('Stripe subscription created:', subscription.id);

    // Store subscription in user_subscriptions table ONLY with PENDING status
    console.log('Storing subscription in user_subscriptions table with PENDING status...');
    const { data: createdSub, error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        status: 'pending', // CRITICAL: Keep as pending until payment succeeds
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        amount: tier.price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error storing subscription in user_subscriptions:', insertError);
      
      // Cancel the Stripe subscription if database insert failed
      try {
        await stripe.subscriptions.cancel(subscription.id);
        console.log('Cancelled Stripe subscription due to database error');
      } catch (cancelError) {
        console.error('Error canceling Stripe subscription:', cancelError);
      }
      
      return createJsonResponse({ 
        error: 'Failed to create subscription record. Please try again.' 
      }, 500);
    }

    console.log('Subscription stored successfully in user_subscriptions:', createdSub.id);

    // Get the client secret for payment
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    
    if (!clientSecret) {
      console.error('No client secret found in subscription');
      return createJsonResponse({ 
        error: 'Failed to initialize payment. Please try again.' 
      }, 500);
    }

    console.log('Returning client secret for payment');
    return createJsonResponse({
      subscriptionId: subscription.id,
      clientSecret: clientSecret,
      amount: tier.price * 100,
      tierName: tier.title
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}
