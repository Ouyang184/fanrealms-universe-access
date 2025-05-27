
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

  // First, clean up any stale or cancelled subscriptions
  console.log('Cleaning up stale subscriptions...');
  
  const { data: allCreatorSubs, error: fetchError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId);

  if (fetchError) {
    console.error('Error fetching creator subscriptions:', fetchError);
  } else if (allCreatorSubs && allCreatorSubs.length > 0) {
    console.log('Found creator subscriptions to verify:', allCreatorSubs.length);
    
    let hasValidActiveSubscription = false;
    
    for (const sub of allCreatorSubs) {
      if (sub.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
          console.log('Stripe subscription status for', sub.id, ':', stripeSubscription.status);
          
          if (stripeSubscription.status === 'active' || 
              stripeSubscription.status === 'trialing' ||
              stripeSubscription.status === 'past_due') {
            hasValidActiveSubscription = true;
            console.log('User has valid active subscription');
            break;
          } else if (stripeSubscription.status === 'canceled' || 
                    stripeSubscription.status === 'incomplete_expired' ||
                    stripeSubscription.status === 'incomplete') {
            // Clean up canceled/failed subscription
            console.log('Cleaning up canceled/failed subscription:', sub.id);
            await supabaseService
              .from('creator_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        } catch (stripeError) {
          console.error('Error checking Stripe subscription:', stripeError);
          // If subscription doesn't exist in Stripe, clean it up
          if (stripeError.code === 'resource_missing') {
            console.log('Cleaning up subscription that no longer exists in Stripe:', sub.id);
            await supabaseService
              .from('creator_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      } else if (sub.status === 'pending') {
        // Check if pending subscription is old (more than 1 hour)
        const createdAt = new Date(sub.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 1) {
          console.log('Cleaning up old pending subscription:', sub.id);
          await supabaseService
            .from('creator_subscriptions')
            .delete()
            .eq('id', sub.id);
        } else {
          // Recent pending subscription
          hasValidActiveSubscription = true;
          console.log('User has recent pending subscription');
        }
      }
    }
    
    if (hasValidActiveSubscription) {
      console.log('User already has active subscription to this creator');
      return createJsonResponse({ 
        error: 'You already have an active subscription to this creator. Please refresh the page to see your current subscription status.',
        shouldRefresh: true
      }, 409); // Use 409 Conflict instead of 400
    }
  }

  // Clean up any stale basic subscriptions
  const { data: existingBasicSubs } = await supabaseService
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('is_paid', true);

  if (existingBasicSubs && existingBasicSubs.length > 0) {
    console.log('Cleaning up basic subscriptions...');
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('creator_id', creatorId);
  }

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

    // Create Stripe subscription
    console.log('Creating Stripe subscription...');
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
      application_fee_percent: 5, // 5% platform fee
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

    // Store subscription in database with pending status
    console.log('Storing subscription in database...');
    const { data: createdSub, error: insertError } = await supabaseService
      .from('creator_subscriptions')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        status: 'pending', // Will be updated by webhook when payment succeeds
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
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
      amount: tier.price * 100, // Return amount in cents
      tierName: tier.title
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}
