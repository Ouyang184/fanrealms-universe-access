
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

  // Enhanced subscription check - check both tables and verify with Stripe
  console.log('Checking for existing subscriptions across all sources...');
  
  // Check creator_subscriptions first
  const { data: creatorSubs, error: creatorSubError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId);

  if (creatorSubError) {
    console.error('Error checking creator subscriptions:', creatorSubError);
  }

  // Check basic subscriptions
  const { data: basicSubs, error: basicSubError } = await supabaseService
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('is_paid', true);

  if (basicSubError) {
    console.error('Error checking basic subscriptions:', basicSubError);
  }

  // Validate all subscriptions against Stripe
  const allSubs = [...(creatorSubs || []), ...(basicSubs || [])];
  let hasActiveSubscription = false;

  for (const sub of allSubs) {
    if (sub.stripe_subscription_id) {
      try {
        console.log('Verifying Stripe subscription:', sub.stripe_subscription_id);
        const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        
        // Only consider it active if Stripe says it's active AND not set to cancel
        if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
          console.log('Found truly active subscription in Stripe');
          hasActiveSubscription = true;
          break;
        } else {
          console.log('Subscription is not truly active, cleaning up:', {
            status: stripeSubscription.status,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
          });
          
          // Clean up stale subscription records
          if (creatorSubs?.some(cs => cs.id === sub.id)) {
            await supabaseService
              .from('creator_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
          
          if (basicSubs?.some(bs => bs.id === sub.id)) {
            await supabaseService
              .from('subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      } catch (stripeError) {
        console.error('Error checking Stripe subscription:', stripeError);
        
        // If subscription doesn't exist in Stripe, clean it up
        if (stripeError.code === 'resource_missing') {
          console.log('Cleaning up subscription that no longer exists in Stripe');
          if (creatorSubs?.some(cs => cs.id === sub.id)) {
            await supabaseService
              .from('creator_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
          
          if (basicSubs?.some(bs => bs.id === sub.id)) {
            await supabaseService
              .from('subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      }
    } else {
      // No Stripe subscription ID, clean up the record
      console.log('Cleaning up subscription record without Stripe ID');
      if (creatorSubs?.some(cs => cs.id === sub.id)) {
        await supabaseService
          .from('creator_subscriptions')
          .delete()
          .eq('id', sub.id);
      }
      
      if (basicSubs?.some(bs => bs.id === sub.id)) {
        await supabaseService
          .from('subscriptions')
          .delete()
          .eq('id', sub.id);
      }
    }
  }

  if (hasActiveSubscription) {
    console.log('User has a truly active subscription, blocking new subscription');
    return createJsonResponse({ 
      error: 'You already have an active subscription to this tier. Please refresh the page to see your current subscription status.',
      shouldRefresh: true
    }, 409);
  }

  // Clean up any old pending subscriptions (older than 1 hour)
  console.log('Cleaning up old pending subscriptions...');
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  await supabaseService
    .from('creator_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
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
