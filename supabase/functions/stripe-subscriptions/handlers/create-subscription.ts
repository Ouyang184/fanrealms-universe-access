
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
  console.log('Creating subscription for tier:', tierId, 'creator:', creatorId);

  if (!tierId || !creatorId) {
    console.log('ERROR: Missing tierId or creatorId');
    return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
  }

  // Check if user already has an active subscription to this creator in BOTH tables
  console.log('Checking for existing subscription in creator_subscriptions...');
  const { data: existingCreatorSubs, error: existingCreatorError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('status', 'active');

  if (existingCreatorError) {
    console.error('Error checking creator_subscriptions:', existingCreatorError);
  }

  console.log('Checking for existing subscription in subscriptions...');
  const { data: existingBasicSubs, error: existingBasicError } = await supabaseService
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId);

  if (existingBasicError) {
    console.error('Error checking subscriptions:', existingBasicError);
  }

  // If user has active subscriptions in either table, block creation
  if ((existingCreatorSubs && existingCreatorSubs.length > 0) || (existingBasicSubs && existingBasicSubs.length > 0)) {
    console.log('User already has active subscription to this creator');
    console.log('Creator subscriptions:', existingCreatorSubs);
    console.log('Basic subscriptions:', existingBasicSubs);
    return createJsonResponse({ error: 'You already have an active subscription to this creator' }, 400);
  }

  // Get tier and creator details
  console.log('Fetching tier details...');
  const { data: tier, error: tierError } = await supabase
    .from('membership_tiers')
    .select('*, creators!inner(stripe_account_id)')
    .eq('id', tierId)
    .single();

  if (tierError || !tier) {
    console.log('ERROR: Tier not found:', tierError);
    return createJsonResponse({ error: 'Tier not found' }, 404);
  }

  console.log('Tier found:', tier);

  if (!tier.creators.stripe_account_id) {
    console.log('ERROR: Creator not connected to Stripe');
    return createJsonResponse({ error: 'Creator not connected to Stripe' }, 400);
  }

  console.log('Creator has Stripe account:', tier.creators.stripe_account_id);

  try {
    // Create or get Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);

    // Create Stripe price if it doesn't exist
    const stripePriceId = await getOrCreateStripePrice(stripe, supabaseService, tier, tierId);

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
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
      },
    });

    console.log('Subscription created:', subscription.id);

    // Store subscription in database with pending status initially
    console.log('Storing subscription in database...');
    const { data: createdSub, error: insertError } = await supabaseService
      .from('creator_subscriptions')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        status: 'pending', // Start as pending, will be updated by webhook
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error storing subscription:', insertError);
      // Try to cancel the Stripe subscription if database insert failed
      try {
        await stripe.subscriptions.cancel(subscription.id);
      } catch (cancelError) {
        console.error('Error canceling Stripe subscription after database failure:', cancelError);
      }
      return createJsonResponse({ error: 'Failed to store subscription' }, 500);
    }

    console.log('Subscription stored in database:', createdSub.id);

    return createJsonResponse({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    return createJsonResponse({ error: 'Failed to create subscription' }, 500);
  }
}
