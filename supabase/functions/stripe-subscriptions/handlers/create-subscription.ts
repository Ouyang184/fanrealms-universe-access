
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

  // If user has existing active subscription to this creator, update the tier instead
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

    // Different tier - update existing subscription
    console.log('Updating existing subscription to new tier');
    
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
      
      // Update the existing Stripe subscription with proration
      console.log('Updating Stripe subscription:', existingSubscription.stripe_subscription_id, 'to price:', newStripePriceId);
      
      const updatedSubscription = await stripe.subscriptions.update(
        existingSubscription.stripe_subscription_id,
        {
          items: [{
            id: (await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id)).items.data[0].id,
            price: newStripePriceId,
          }],
          proration_behavior: 'always_invoice', // Apply proration automatically
          metadata: {
            user_id: user.id,
            creator_id: creatorId,
            tier_id: tierId,
            tier_name: newTier.title,
            creator_name: newTier.creators.display_name
          }
        }
      );

      console.log('Stripe subscription updated successfully:', updatedSubscription.id);

      // Update the database record
      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update({
          tier_id: tierId,
          amount: newTier.price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription in database:', updateError);
        return createJsonResponse({ error: 'Failed to update subscription record' }, 500);
      }

      console.log('Subscription tier updated successfully');
      return createJsonResponse({
        success: true,
        message: 'Subscription tier updated successfully',
        subscriptionId: updatedSubscription.id,
        shouldRefresh: true
      });

    } catch (error) {
      console.error('Error updating subscription tier:', error);
      return createJsonResponse({ 
        error: 'Failed to update subscription tier. Please try again.' 
      }, 500);
    }
  }

  console.log('No existing active subscriptions found, proceeding with creation...');

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
        
        // Ensure our database is in sync - store ONLY in user_subscriptions
        await supabaseService
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            creator_id: creatorId,
            tier_id: tierId,
            stripe_subscription_id: stripeSub.id,
            stripe_customer_id: stripeCustomerId,
            status: 'active',
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            amount: tier.price,
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id,creator_id,tier_id',
            ignoreDuplicates: false 
          });

        return createJsonResponse({ 
          error: 'You already have an active subscription to this tier.',
          shouldRefresh: true
        }, 200);
      }
    }

    // Create or get Stripe price
    console.log('Creating/getting Stripe price...');
    const stripePriceId = await getOrCreateStripePrice(stripe, supabaseService, tier, tierId);
    console.log('Stripe price ID:', stripePriceId);

    // Create Stripe subscription - ALWAYS requires payment
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

    console.log('Stripe subscription created:', subscription.id, 'Status:', subscription.status);

    // AUTO-DELETE INCOMPLETE SUBSCRIPTIONS
    if (subscription.status === 'incomplete') {
      console.log('Subscription created with incomplete status, auto-deleting...');
      
      try {
        await stripe.subscriptions.del(subscription.id);
        console.log('Auto-deleted incomplete subscription:', subscription.id);
        
        return createJsonResponse({ 
          error: 'Payment setup incomplete. Please try again with valid payment information.' 
        }, 400);
      } catch (deleteError) {
        console.error('Error auto-deleting incomplete subscription:', deleteError);
        // Continue with normal flow if deletion fails
      }
    }

    // Store subscription in user_subscriptions table ONLY with appropriate status
    console.log('Storing subscription in user_subscriptions table...');
    const { data: createdSub, error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: stripeCustomerId,
        status: subscription.status === 'incomplete' ? 'incomplete' : 'pending', // Set appropriate status
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        amount: tier.price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error storing subscription in user_subscriptions:', insertError);
      
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

    console.log('Subscription stored successfully in user_subscriptions:', createdSub.id);

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
