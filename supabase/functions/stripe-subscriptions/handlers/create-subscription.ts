
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOrCreateStripeCustomer } from '../services/stripe-customer.ts';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('[CreateSubscription] === STARTING SUBSCRIPTION CREATION ===');
  console.log('[CreateSubscription] User ID:', user.id);
  console.log('[CreateSubscription] User email:', user.email);
  console.log('[CreateSubscription] Request body:', JSON.stringify(body, null, 2));

  // Extract parameters from body - handle both formats
  const tierId = body.tierId || body.tier_id;
  const creatorId = body.creatorId || body.creator_id;

  console.log('[CreateSubscription] Extracted params:', { tierId, creatorId });
  console.log('[CreateSubscription] Parameter validation:', {
    hasTierId: !!tierId,
    hasCreatorId: !!creatorId,
    tierIdType: typeof tierId,
    creatorIdType: typeof creatorId
  });

  if (!tierId || !creatorId) {
    console.log('ERROR: Missing tierId or creatorId', { tierId, creatorId });
    return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
  }

  // Create service client for database operations
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check for existing active subscriptions to the same creator
  console.log('Checking for existing active subscriptions to creator:', creatorId);
  const { data: existingSubscriptions, error: checkError } = await supabaseService
    .from('user_subscriptions')
    .select('*, membership_tiers!inner(title, price)')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active', 'trialing']);

  if (checkError) {
    console.error('Error checking existing subscriptions:', checkError);
    return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
  }

  let isUpgrade = false;
  let existingSubscription = null;
  let proratedAmount = 0;

  // If user has existing active subscription to this creator, check if it's an upgrade
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    existingSubscription = existingSubscriptions[0];
    console.log('Found existing active subscription:', existingSubscription);
    
    // Check if user is trying to subscribe to a different tier (upgrade/downgrade)
    if (existingSubscription.tier_id !== tierId) {
      isUpgrade = true;
      console.log('Detected tier upgrade/change from:', existingSubscription.tier_id, 'to:', tierId);
    } else {
      // Same tier - return error
      return createJsonResponse({ 
        error: 'You already have an active subscription to this tier.',
        shouldRefresh: true
      }, 200);
    }
  }

  console.log('Subscription type:', isUpgrade ? 'UPGRADE' : 'NEW');

  // Get tier and creator details
  console.log('Fetching tier and creator details...');
  const { data: tier, error: tierError } = await supabaseService
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

  // Calculate prorated amount for upgrades
  if (isUpgrade && existingSubscription) {
    const currentTierPrice = existingSubscription.membership_tiers.price;
    const newTierPrice = tier.price;
    proratedAmount = newTierPrice - currentTierPrice;
    
    console.log('Prorated calculation:', {
      currentTierPrice,
      newTierPrice,
      proratedAmount
    });

    // Don't allow downgrades to negative amounts
    if (proratedAmount < 0) {
      return createJsonResponse({ 
        error: 'Downgrades are not currently supported. Please contact support.' 
      }, 400);
    }

    // Free upgrade case
    if (proratedAmount === 0) {
      return createJsonResponse({ 
        error: 'This tier has the same price as your current subscription.' 
      }, 400);
    }
  }

  try {
    // Create or get Stripe customer
    console.log('Creating/getting Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
    console.log('Stripe customer ID:', stripeCustomerId);

    // Create or get Stripe price for this tier
    let stripePriceId = tier.stripe_price_id;
    
    if (!stripePriceId) {
      console.log('Creating Stripe price for tier:', tier.title);
      const price = await stripe.prices.create({
        unit_amount: Math.round(tier.price * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: tier.title,
          description: tier.description || `${tier.title} membership`
        }
      });
      
      stripePriceId = price.id;
      
      // Update tier with stripe price ID
      await supabaseService
        .from('membership_tiers')
        .update({ stripe_price_id: stripePriceId })
        .eq('id', tierId);
      
      console.log('Created and saved Stripe price:', stripePriceId);
    }

    // Check for existing incomplete subscriptions for this user/creator/tier combination
    console.log('Checking for existing incomplete subscriptions...');
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'incomplete',
      limit: 10
    });

    // Look for existing incomplete subscription with same metadata
    let existingIncompleteSubscription = null;
    for (const sub of existingSubscriptions.data) {
      const metadata = sub.metadata || {};
      if (metadata.creator_id === creatorId && 
          metadata.user_id === user.id && 
          metadata.tier_id === tierId &&
          metadata.is_upgrade === (isUpgrade ? 'true' : 'false')) {
        existingIncompleteSubscription = sub;
        console.log('Found reusable incomplete subscription:', sub.id);
        break;
      }
    }

    // If we found a reusable incomplete subscription, return it
    if (existingIncompleteSubscription && existingIncompleteSubscription.latest_invoice?.payment_intent?.client_secret) {
      console.log('Reusing existing incomplete subscription:', existingIncompleteSubscription.id);
      
      return createJsonResponse({
        clientSecret: existingIncompleteSubscription.latest_invoice.payment_intent.client_secret,
        subscriptionId: existingIncompleteSubscription.id,
        tierName: tier.title,
        tierId: tierId,
        creatorId: creatorId,
        useCustomPaymentPage: true,
        isUpgrade: isUpgrade,
        currentTierName: existingSubscription?.membership_tiers?.title || null,
        fullTierPrice: Math.round(tier.price * 100),
        reusedSession: true
      });
    }

    // Cancel any old incomplete subscriptions to clean up
    console.log('Cleaning up old incomplete subscriptions...');
    for (const sub of existingSubscriptions.data) {
      const metadata = sub.metadata || {};
      if (metadata.creator_id === creatorId && metadata.user_id === user.id) {
        console.log('Cancelling old incomplete subscription:', sub.id);
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    // Clean up old pending/incomplete subscriptions
    console.log('Cleaning up old pending subscriptions...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    await supabaseService
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('creator_id', creatorId)
      .in('status', ['pending', 'incomplete'])
      .lt('created_at', oneHourAgo);

    // Clean up ALL records from legacy subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('creator_id', creatorId);

    // Create actual Stripe Subscription for recurring billing
    console.log('Creating Stripe Subscription for tier:', tier.title);

    const subscriptionData: any = {
      customer: stripeCustomerId,
      items: [{
        price: stripePriceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card']
      },
      expand: ['latest_invoice.payment_intent'],
      application_fee_percent: 4,
      transfer_data: {
        destination: tier.creators.stripe_account_id
      },
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        tier_name: tier.title,
        creator_name: tier.creators.display_name,
        is_upgrade: isUpgrade ? 'true' : 'false',
        existing_subscription_id: existingSubscription?.stripe_subscription_id || '',
        existing_tier_id: existingSubscription?.tier_id || '',
        platform_fee_percent: '4'
      }
    };

    // Handle upgrades by canceling existing subscription
    if (isUpgrade && existingSubscription?.stripe_subscription_id) {
      console.log('Canceling existing subscription for upgrade:', existingSubscription.stripe_subscription_id);
      await stripe.subscriptions.cancel(existingSubscription.stripe_subscription_id);
      
      // Update existing subscription status in database
      await supabaseService
        .from('user_subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', existingSubscription.stripe_subscription_id);
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log('Stripe Subscription created:', subscription.id);

    // Create initial subscription record in database
    const subscriptionRecord = {
      user_id: user.id,
      creator_id: creatorId,
      tier_id: tierId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      amount: tier.price,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    };

    const { error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert(subscriptionRecord);

    if (insertError) {
      console.error('Failed to create subscription record:', insertError);
    }

    return createJsonResponse({
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      subscriptionId: subscription.id,
      tierName: tier.title,
      tierId: tierId,
      creatorId: creatorId,
      useCustomPaymentPage: true,
      isUpgrade: isUpgrade,
      currentTierName: existingSubscription?.membership_tiers?.title || null,
      fullTierPrice: Math.round(tier.price * 100),
      reusedSession: false
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}
