
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

  // Check for existing active subscriptions to this creator with more detailed logging
  console.log('Checking for existing subscriptions to creator:', creatorId, 'for user:', user.id);
  
  const { data: existingCreatorSubs, error: existingCreatorError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active', 'pending']);

  if (existingCreatorError) {
    console.error('Error checking creator_subscriptions:', existingCreatorError);
  } else {
    console.log('Found creator_subscriptions:', existingCreatorSubs?.length || 0, existingCreatorSubs);
  }

  const { data: existingBasicSubs, error: existingBasicError } = await supabaseService
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('is_paid', true);

  if (existingBasicError) {
    console.error('Error checking subscriptions:', existingBasicError);
  } else {
    console.log('Found basic subscriptions:', existingBasicSubs?.length || 0, existingBasicSubs);
  }

  // If there are existing subscriptions, clean them up first to avoid conflicts
  if ((existingCreatorSubs && existingCreatorSubs.length > 0) || 
      (existingBasicSubs && existingBasicSubs.length > 0)) {
    
    console.log('Found existing subscriptions, cleaning them up...');
    
    // Delete any stale basic subscriptions
    if (existingBasicSubs && existingBasicSubs.length > 0) {
      const { error: deleteBasicError } = await supabaseService
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('creator_id', creatorId);
      
      if (deleteBasicError) {
        console.error('Error deleting basic subscriptions:', deleteBasicError);
      } else {
        console.log('Deleted basic subscriptions successfully');
      }
    }
    
    // For creator subscriptions, check if they're actually active in Stripe
    if (existingCreatorSubs && existingCreatorSubs.length > 0) {
      for (const sub of existingCreatorSubs) {
        if (sub.stripe_subscription_id) {
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
            console.log('Stripe subscription status:', stripeSubscription.status);
            
            // If the Stripe subscription is not active, clean up the database record
            if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
              console.log('Cleaning up inactive subscription record:', sub.id);
              const { error: deleteError } = await supabaseService
                .from('creator_subscriptions')
                .delete()
                .eq('id', sub.id);
              
              if (deleteError) {
                console.error('Error deleting inactive subscription:', deleteError);
              }
            } else {
              console.log('User already has active subscription to this creator');
              return createJsonResponse({ 
                error: 'You already have an active subscription to this creator. Only one subscription per creator is allowed.' 
              }, 400);
            }
          } catch (stripeError) {
            console.error('Error checking Stripe subscription:', stripeError);
            // If we can't verify with Stripe, delete the record to be safe
            const { error: deleteError } = await supabaseService
              .from('creator_subscriptions')
              .delete()
              .eq('id', sub.id);
            
            if (deleteError) {
              console.error('Error deleting unverifiable subscription:', deleteError);
            } else {
              console.log('Deleted unverifiable subscription record');
            }
          }
        } else {
          // No Stripe subscription ID, delete the record
          console.log('Deleting subscription without Stripe ID:', sub.id);
          const { error: deleteError } = await supabaseService
            .from('creator_subscriptions')
            .delete()
            .eq('id', sub.id);
          
          if (deleteError) {
            console.error('Error deleting subscription without Stripe ID:', deleteError);
          }
        }
      }
    }
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
