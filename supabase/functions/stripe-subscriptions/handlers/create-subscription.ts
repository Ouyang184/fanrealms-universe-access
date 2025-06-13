
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

  if (!newTier.creators.stripe_account_id) {
    console.log('ERROR: Creator not connected to Stripe');
    return createJsonResponse({ 
      error: 'This creator has not set up payments yet. Please try again later.' 
    }, 400);
  }

  if (!newTier.stripe_price_id) {
    console.log('ERROR: New tier missing stripe_price_id');
    return createJsonResponse({ 
      error: 'This membership tier is not properly configured. Please contact the creator.' 
    }, 400);
  }

  // Create or get Stripe customer
  console.log('Creating/getting Stripe customer...');
  const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
  console.log('Stripe customer ID:', stripeCustomerId);

  // Handle tier upgrade scenario
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    const existingSubscription = existingSubscriptions[0];
    const currentTier = existingSubscription.tier;
    
    console.log('Found existing subscription to same creator:', {
      currentTier: currentTier.title,
      currentPrice: currentTier.price,
      newTier: newTier.title,
      newPrice: newTier.price
    });

    // Check if upgrading to the same tier
    if (existingSubscription.tier_id === tierId) {
      return createJsonResponse({ 
        error: 'You already have an active subscription to this tier.',
        shouldRefresh: true
      }, 200);
    }

    // Cancel ALL existing payment intents for this customer and creator to prevent duplicates
    console.log('Cancelling ALL pending payment intents for this customer and creator...');
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: stripeCustomerId,
        limit: 100
      });

      let cancelledCount = 0;
      for (const intent of paymentIntents.data) {
        if (intent.status === 'requires_payment_method' || intent.status === 'requires_confirmation') {
          // Check if this payment intent is for the same creator
          const metadata = intent.metadata;
          if (metadata.creator_id === creatorId) {
            try {
              await stripe.paymentIntents.cancel(intent.id);
              console.log('Cancelled payment intent:', intent.id);
              cancelledCount++;
            } catch (cancelError) {
              console.warn('Failed to cancel payment intent:', intent.id, cancelError.message);
            }
          }
        }
      }
      console.log(`Cancelled ${cancelledCount} existing payment intents for this user/creator combination`);
    } catch (error) {
      console.warn('Error cancelling existing payment intents:', error);
    }

    // Calculate prorated upgrade amount
    const currentPrice = currentTier.price;
    const newPrice = newTier.price;
    const priceDifference = newPrice - currentPrice;

    if (priceDifference <= 0) {
      return createJsonResponse({ 
        error: 'Cannot downgrade tiers. Please contact support for assistance.' 
      }, 400);
    }

    // Calculate prorated amount based on remaining days in current period
    const currentPeriodEnd = new Date(existingSubscription.current_period_end);
    const now = new Date();
    const totalDaysInPeriod = 30; // Assuming monthly billing
    const remainingDays = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const proratedAmount = (priceDifference * remainingDays) / totalDaysInPeriod;

    console.log('Calculated prorated upgrade amount:', proratedAmount);

    // Create new prorated Payment Intent for tier upgrade
    console.log('Creating new prorated Payment Intent for tier upgrade...');
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
        existing_tier_id: existingSubscription.tier_id,
        current_period_end: existingSubscription.current_period_end,
        prorated_amount: proratedAmount.toFixed(2),
        price_difference: priceDifference.toFixed(2)
      },
      setup_future_usage: 'off_session',
    });

    console.log('New prorated Payment Intent created:', paymentIntent.id);

    return createJsonResponse({
      clientSecret: paymentIntent.client_secret,
      amount: Math.round(proratedAmount * 100),
      tierName: newTier.title,
      tierId: tierId,
      creatorId: creatorId,
      paymentIntentId: paymentIntent.id,
      useCustomPaymentPage: true,
      isUpgrade: true,
      currentTierName: currentTier.title,
      currentTierPrice: currentPrice,
      newTierPrice: newTier.price,
      proratedAmount: proratedAmount,
      remainingDays: remainingDays
    });
  }

  // If user has no existing subscription to this creator, proceed with regular subscription creation
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

  try {
    // Create Payment Intent for custom payment form
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
      setup_future_usage: 'off_session', // For future subscription payments
    });

    console.log('Payment Intent created:', paymentIntent.id);

    return createJsonResponse({
      clientSecret: paymentIntent.client_secret,
      amount: Math.round(newTier.price * 100),
      tierName: newTier.title,
      tierId: tierId,
      creatorId: creatorId,
      paymentIntentId: paymentIntent.id,
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
