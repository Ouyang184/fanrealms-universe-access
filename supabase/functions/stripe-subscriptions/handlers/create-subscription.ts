
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOrCreateStripeCustomer } from '../services/stripe-customer.ts';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('Creating subscription for user:', user.id);
  console.log('Request body:', JSON.stringify(body, null, 2));

  // Extract parameters from body - handle both formats
  const tierId = body.tierId || body.tier_id;
  const creatorId = body.creatorId || body.creator_id;

  console.log('Extracted params:', { tierId, creatorId });

  if (!tierId || !creatorId) {
    console.log('ERROR: Missing tierId or creatorId', { tierId, creatorId });
    return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
  }

  // Create service client for database operations
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // CRITICAL: Check for existing active subscriptions to the same creator
  console.log('Checking for existing active subscriptions to creator:', creatorId);
  const { data: existingSubscriptions, error: checkError } = await supabaseService
    .from('user_subscriptions')
    .select(`
      *,
      tier:membership_tiers(
        id,
        title,
        price
      )
    `)
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active', 'trialing']);

  if (checkError) {
    console.error('Error checking existing subscriptions:', checkError);
    return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
  }

  // Get new tier details
  console.log('Fetching new tier details...');
  const { data: newTier, error: tierError } = await supabase
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

  if (tierError || !newTier) {
    console.log('ERROR: New tier not found:', tierError);
    return createJsonResponse({ error: 'Membership tier not found' }, 404);
  }

  console.log('New tier found:', newTier.title, 'Price:', newTier.price);

  // Check if this is an upgrade scenario
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    const existingSubscription = existingSubscriptions[0];
    const currentTier = existingSubscription.tier;
    
    console.log('Found existing subscription to same creator:', {
      currentTier: currentTier.title,
      currentPrice: currentTier.price,
      newTier: newTier.title,
      newPrice: newTier.price
    });

    // If trying to subscribe to the same tier, return error
    if (existingSubscription.tier_id === tierId) {
      return createJsonResponse({ 
        error: 'You already have an active subscription to this tier.',
        shouldRefresh: true
      }, 200);
    }

    // Calculate prorated upgrade amount
    const currentPrice = parseFloat(currentTier.price);
    const newPrice = parseFloat(newTier.price);
    const priceDifference = newPrice - currentPrice;

    if (priceDifference <= 0) {
      return createJsonResponse({ 
        error: 'Cannot downgrade tiers. Please contact support for assistance.',
      }, 400);
    }

    // Get subscription period info for prorating
    const periodStart = new Date(existingSubscription.current_period_start);
    const periodEnd = new Date(existingSubscription.current_period_end);
    const now = new Date();
    
    const totalPeriodDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
    const remainingDays = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const proratedAmount = (priceDifference * remainingDays) / totalPeriodDays;

    console.log('Calculated prorated upgrade amount:', proratedAmount);

    try {
      // Create or get Stripe customer
      console.log('Creating/getting Stripe customer for upgrade...');
      const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
      console.log('Stripe customer ID:', stripeCustomerId);

      // Create Payment Intent for upgrade payment
      console.log('Creating prorated Payment Intent for tier upgrade...');
      const paymentIntent = await stripe.paymentIntents.create({
        customer: stripeCustomerId,
        amount: Math.round(proratedAmount * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card'],
        metadata: {
          user_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          tier_name: newTier.title,
          creator_name: newTier.creators.display_name,
          type: 'tier_upgrade',
          existing_subscription_id: existingSubscription.stripe_subscription_id,
          current_tier_id: existingSubscription.tier_id,
          current_tier_name: currentTier.title,
          current_price: currentPrice.toString(),
          new_price: newPrice.toString(),
          prorated_amount: proratedAmount.toString()
        },
        setup_future_usage: 'off_session',
      });

      console.log('Prorated Payment Intent created:', paymentIntent.id);

      return createJsonResponse({
        clientSecret: paymentIntent.client_secret,
        amount: Math.round(proratedAmount * 100),
        tierName: newTier.title,
        tierId: tierId,
        creatorId: creatorId,
        paymentIntentId: paymentIntent.id,
        isUpgrade: true,
        currentTier: {
          id: existingSubscription.tier_id,
          name: currentTier.title,
          price: currentPrice
        },
        newTier: {
          id: tierId,
          name: newTier.title,
          price: newPrice
        },
        proratedAmount: proratedAmount,
        billingEndDate: existingSubscription.current_period_end,
        useCustomPaymentPage: true
      });

    } catch (error) {
      console.error('Error in tier upgrade:', error);
      return createJsonResponse({ 
        error: 'Failed to process tier upgrade. Please try again later.' 
      }, 500);
    }
  }

  // If user has existing active subscription to this creator, return error
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    const existingSubscription = existingSubscriptions[0];
    console.log('Found existing active subscription:', existingSubscription);
    
    return createJsonResponse({ 
      error: 'You already have an active subscription to this creator.',
      shouldRefresh: true
    }, 200);
  }

  console.log('No existing active subscriptions found, proceeding with new subscription creation...');

  // Clean up old pending/incomplete subscriptions
  console.log('Cleaning up old pending/incomplete subscriptions...');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  await supabaseService
    .from('user_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['pending', 'incomplete'])
    .lt('created_at', oneHourAgo);

  // Clean up ALL records from legacy subscriptions table
  console.log('Cleaning up legacy subscriptions table...');
  await supabaseService
    .from('subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId);

  console.log('Creator stripe account:', newTier.creators.stripe_account_id);

  if (!newTier.creators.stripe_account_id) {
    console.log('ERROR: Creator not connected to Stripe');
    return createJsonResponse({ 
      error: 'This creator has not set up payments yet. Please try again later.' 
    }, 400);
  }

  // Check if tier has stripe_price_id
  if (!newTier.stripe_price_id) {
    console.log('ERROR: Tier missing stripe_price_id');
    return createJsonResponse({ 
      error: 'This membership tier is not properly configured. Please contact the creator.' 
    }, 400);
  }

  try {
    // Create or get Stripe customer
    console.log('Creating/getting Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
    console.log('Stripe customer ID:', stripeCustomerId);

    // Create Payment Intent for new subscription
    console.log('Creating Stripe Payment Intent for new subscription...');
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeCustomerId,
      amount: Math.round(newTier.price * 100), // Convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        tier_name: newTier.title,
        creator_name: newTier.creators.display_name,
        type: 'subscription_setup'
      },
      setup_future_usage: 'off_session',
    });

    console.log('Payment Intent created:', paymentIntent.id);

    return createJsonResponse({
      clientSecret: paymentIntent.client_secret,
      amount: Math.round(newTier.price * 100),
      tierName: newTier.title,
      tierId: tierId,
      creatorId: creatorId,
      paymentIntentId: paymentIntent.id,
      isUpgrade: false,
      useCustomPaymentPage: true
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    console.error('Full Stripe error details:', JSON.stringify(error, null, 2));
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}
