
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

  // Check for existing active subscriptions to the same creator
  console.log('Checking for existing active subscriptions to creator:', creatorId);
  const { data: existingSubscriptions, error: checkError } = await supabaseService
    .from('user_subscriptions')
    .select(`
      *,
      tier:membership_tiers(id, title, price)
    `)
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active', 'trialing']);

  if (checkError) {
    console.error('Error checking existing subscriptions:', checkError);
    return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
  }

  // Get tier details for new subscription
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
    console.log('ERROR: Tier not found:', tierError);
    return createJsonResponse({ error: 'Membership tier not found' }, 404);
  }

  console.log('New tier found:', newTier.title, 'Price:', newTier.price);

  // Create or get Stripe customer first
  console.log('Creating/getting Stripe customer...');
  const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
  console.log('Stripe customer ID:', stripeCustomerId);

  // AGGRESSIVE cleanup: Cancel ALL pending payment intents for this customer and creator
  console.log('Cancelling ALL pending payment intents for this customer and creator...');
  const allPendingPaymentIntents = await stripe.paymentIntents.list({
    customer: stripeCustomerId,
    limit: 100
  });

  let cancelledCount = 0;
  for (const pi of allPendingPaymentIntents.data) {
    // Cancel any payment intent that matches this user and creator combination
    if (pi.status === 'requires_payment_method' &&
        pi.metadata.user_id === user.id &&
        pi.metadata.creator_id === creatorId) {
      try {
        await stripe.paymentIntents.cancel(pi.id);
        cancelledCount++;
        console.log('Cancelled payment intent:', pi.id);
      } catch (error) {
        console.log('Could not cancel payment intent:', pi.id, error.message);
      }
    }
  }
  console.log(`Cancelled ${cancelledCount} existing payment intents for this user/creator combination`);

  // Handle tier upgrade scenario
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    const existingSubscription = existingSubscriptions[0];
    const currentTier = existingSubscription.tier;
    
    console.log('Found existing subscription to same creator:', {
      currentTier: currentTier?.title,
      currentPrice: currentTier?.price,
      newTier: newTier.title,
      newPrice: newTier.price
    });

    // Check if it's the same tier
    if (existingSubscription.tier_id === tierId) {
      return createJsonResponse({ 
        error: 'You are already subscribed to this tier.',
        shouldRefresh: true
      }, 200);
    }

    // Calculate prorated amount for upgrade
    const currentPrice = currentTier?.price || 0;
    const newPrice = newTier.price;
    const priceDifference = newPrice - currentPrice;

    if (priceDifference <= 0) {
      return createJsonResponse({ 
        error: 'Downgrades are not currently supported. Please cancel your current subscription first.',
      }, 400);
    }

    // Calculate prorated amount based on remaining days in current period
    let proratedAmount = priceDifference;
    
    if (existingSubscription.current_period_end) {
      const now = new Date();
      const periodEnd = new Date(existingSubscription.current_period_end);
      const periodStart = new Date(existingSubscription.current_period_start || now);
      
      const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (totalDays > 0 && remainingDays > 0) {
        const proratedRatio = remainingDays / totalDays;
        proratedAmount = Math.round(priceDifference * proratedRatio * 100) / 100;
      }
    }

    console.log('Calculated prorated upgrade amount:', proratedAmount);

    try {
      // Create new Payment Intent for tier upgrade with prorated amount
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
          type: 'tier_upgrade',
          tier_name: newTier.title,
          creator_name: newTier.creators.display_name,
          current_period_end: existingSubscription.current_period_end,
          original_tier_id: existingSubscription.tier_id,
          existing_subscription_id: existingSubscription.stripe_subscription_id,
          prorated_amount: proratedAmount.toString()
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
        currentTier: currentTier?.title,
        proratedAmount: proratedAmount,
        originalAmount: newTier.price,
        currentPeriodEnd: existingSubscription.current_period_end
      });

    } catch (error) {
      console.error('Error in tier upgrade:', error);
      return createJsonResponse({ 
        error: 'Failed to create tier upgrade. Please try again later.' 
      }, 500);
    }
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
    // Create Payment Intent for custom payment form
    console.log('Creating new Stripe Payment Intent for custom payment form...');
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeCustomerId,
      amount: Math.round(newTier.price * 100), // Convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        type: 'subscription_setup',
        tier_name: newTier.title,
        creator_name: newTier.creators.display_name
      },
      setup_future_usage: 'off_session', // For future subscription payments
    });
    console.log('New Payment Intent created:', paymentIntent.id);

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
