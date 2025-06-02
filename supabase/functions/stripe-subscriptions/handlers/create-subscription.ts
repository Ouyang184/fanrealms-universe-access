
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

  // CRITICAL: Check for existing active subscriptions to the same creator
  console.log('Checking for existing active subscriptions to creator:', creatorId);
  const { data: existingSubscriptions, error: checkError } = await supabaseService
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active', 'trialing']);

  if (checkError) {
    console.error('Error checking existing subscriptions:', checkError);
    return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
  }

  // If user has existing active subscription to this creator, handle tier change
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    const existingSubscription = existingSubscriptions[0];
    console.log('Found existing active subscription:', existingSubscription);
    
    // If it's the same tier, return error
    if (existingSubscription.tier_id === tierId) {
      console.log('User already subscribed to this tier');
      return createJsonResponse({ 
        error: 'You already have an active subscription to this tier.',
        shouldRefresh: true
      }, 200);
    }

    // Different tier - create Stripe Checkout session for tier change
    console.log('Creating Stripe Checkout session for tier change');
    
    // Get new tier details
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

    try {
      // Get or create new price for the tier
      const newStripePriceId = await getOrCreateStripePrice(stripe, supabaseService, newTier, tierId);
      
      // Create Stripe Checkout session for subscription update
      console.log('Creating Stripe Checkout session for tier change');
      
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: existingSubscription.stripe_customer_id,
        mode: 'subscription',
        line_items: [{
          price: newStripePriceId,
          quantity: 1,
        }],
        subscription_data: {
          metadata: {
            user_id: user.id,
            creator_id: creatorId,
            tier_id: tierId,
            tier_name: newTier.title,
            creator_name: newTier.creators.display_name,
            existing_subscription_id: existingSubscription.stripe_subscription_id,
            action: 'tier_change'
          },
          proration_behavior: 'always_invoice'
        },
        application_fee_percent: 5,
        success_url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/subscriptions?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/creator/${creatorId}`,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        payment_method_types: ['card'],
      });

      console.log('Checkout session created for tier change:', checkoutSession.id);

      return createJsonResponse({
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
        action: 'tier_change',
        message: 'Redirecting to checkout for tier change'
      });

    } catch (error) {
      console.error('Error creating checkout session for tier change:', error);
      return createJsonResponse({ 
        error: 'Failed to create checkout session for tier change. Please try again.' 
      }, 500);
    }
  }

  console.log('No existing active subscriptions found, proceeding with new subscription creation...');

  // Clean up old pending/incomplete subscriptions from user_subscriptions ONLY
  console.log('Cleaning up old pending/incomplete subscriptions from user_subscriptions...');
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

    // Create or get Stripe price
    console.log('Creating/getting Stripe price...');
    const stripePriceId = await getOrCreateStripePrice(stripe, supabaseService, tier, tierId);
    console.log('Stripe price ID:', stripePriceId);

    // Create Stripe Checkout session for new subscription
    console.log('Creating Stripe Checkout session for new subscription...');
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{
        price: stripePriceId,
        quantity: 1,
      }],
      subscription_data: {
        application_fee_percent: 5,
        transfer_data: {
          destination: tier.creators.stripe_account_id,
        },
        metadata: {
          user_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          tier_name: tier.title,
          creator_name: tier.creators.display_name
        }
      },
      success_url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/subscriptions?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/creator/${creatorId}`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_method_types: ['card'],
    });

    console.log('Checkout session created:', checkoutSession.id);

    return createJsonResponse({
      checkout_url: checkoutSession.url,
      session_id: checkoutSession.id,
      action: 'new_subscription',
      message: 'Redirecting to checkout for new subscription'
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}
