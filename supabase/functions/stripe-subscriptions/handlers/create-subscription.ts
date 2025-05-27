
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

  // Simple but thorough duplicate check
  console.log('Checking for existing active subscriptions...');
  
  // Check creator_subscriptions for active subscriptions
  const { data: existingCreatorSub, error: creatorSubError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('status', 'active')
    .maybeSingle();

  if (creatorSubError) {
    console.error('Error checking creator subscriptions:', creatorSubError);
  }

  if (existingCreatorSub) {
    console.log('Found existing active creator subscription');
    return createJsonResponse({ 
      error: 'You already have an active subscription to this tier.',
      shouldRefresh: true
    }, 409);
  }

  // Check basic subscriptions table
  const { data: existingBasicSub, error: basicSubError } = await supabaseService
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('is_paid', true)
    .maybeSingle();

  if (basicSubError) {
    console.error('Error checking basic subscriptions:', basicSubError);
  }

  if (existingBasicSub) {
    console.log('Found existing basic subscription');
    return createJsonResponse({ 
      error: 'You already have an active subscription to this tier.',
      shouldRefresh: true
    }, 409);
  }

  // Clean up any truly old pending subscriptions (older than 1 hour)
  console.log('Cleaning up old pending subscriptions...');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  await supabaseService
    .from('creator_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('status', 'pending')
    .lt('created_at', oneHourAgo);

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
        
        // Ensure our database is in sync
        await supabaseService
          .from('creator_subscriptions')
          .upsert({
            user_id: user.id,
            creator_id: creatorId,
            tier_id: tierId,
            stripe_subscription_id: stripeSub.id,
            stripe_customer_id: stripeCustomerId,
            status: 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            amount_paid: tier.price,
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id,creator_id,tier_id',
            ignoreDuplicates: false 
          });

        return createJsonResponse({ 
          error: 'You already have an active subscription to this tier.',
          shouldRefresh: true
        }, 409);
      }
    }

    // Create or get Stripe price
    console.log('Creating/getting Stripe price...');
    const stripePriceId = await getOrCreateStripePrice(stripe, supabaseService, tier, tierId);
    console.log('Stripe price ID:', stripePriceId);

    // Create Stripe subscription
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

    // Store subscription in database
    console.log('Storing subscription in database...');
    const { data: createdSub, error: insertError } = await supabaseService
      .from('creator_subscriptions')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        status: 'pending',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        amount_paid: tier.price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error storing subscription in database:', insertError);
      
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

    console.log('Subscription stored successfully:', createdSub.id);

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
