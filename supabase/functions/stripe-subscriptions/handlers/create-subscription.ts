
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
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active', 'trialing']);

  if (checkError) {
    console.error('Error checking existing subscriptions:', checkError);
    return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
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
  console.log('Creator stripe account:', tier.creators.stripe_account_id);

  if (!tier.creators.stripe_account_id) {
    console.log('ERROR: Creator not connected to Stripe');
    return createJsonResponse({ 
      error: 'This creator has not set up payments yet. Please try again later.' 
    }, 400);
  }

  // Check if tier has stripe_price_id
  if (!tier.stripe_price_id) {
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

    // Create Payment Intent for custom payment form
    console.log('Creating Stripe Payment Intent for custom payment form...');
    const paymentIntent = await stripe.paymentIntents.create({
      customer: stripeCustomerId,
      amount: Math.round(tier.price * 100), // Convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        tier_name: tier.title,
        creator_name: tier.creators.display_name,
        type: 'subscription_setup'
      },
      setup_future_usage: 'off_session', // For future subscription payments
    });

    console.log('Payment Intent created:', paymentIntent.id);

    return createJsonResponse({
      clientSecret: paymentIntent.client_secret,
      amount: Math.round(tier.price * 100),
      tierName: tier.title,
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
