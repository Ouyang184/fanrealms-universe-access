
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

  try {
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
      .select('*, membership_tiers!inner(title, price)')
      .eq('user_id', user.id)
      .eq('creator_id', creatorId)
      .in('status', ['active', 'trialing']);

    if (checkError) {
      console.error('Error checking existing subscriptions:', checkError);
      return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
    }

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSubscription = existingSubscriptions[0];
      console.log('Found existing active subscription:', existingSubscription);
      
      // Check if user is trying to subscribe to a different tier (upgrade/downgrade)
      if (existingSubscription.tier_id !== tierId) {
        console.log('User trying to change tier - this should be handled as upgrade');
        // For now, return error - upgrade flow can be implemented later
        return createJsonResponse({ 
          error: 'You already have an active subscription to this creator. Please cancel your current subscription first.' 
        }, 400);
      } else {
        // Same tier - return error
        return createJsonResponse({ 
          error: 'You already have an active subscription to this tier.',
          shouldRefresh: true
        }, 200);
      }
    }

    console.log('No existing subscriptions found, proceeding with creation...');

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

    // Create or get Stripe customer
    console.log('Creating/getting Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
    console.log('Stripe customer ID:', stripeCustomerId);

    // Create or get Stripe price for this tier
    let stripePriceId = tier.stripe_price_id;
    
    if (!stripePriceId) {
      console.log('Creating Stripe price for tier:', tier.title);
      const price = await stripe.prices.create({
        unit_amount: Math.round(tier.price * 100),
        currency: 'usd',
        recurring: { interval: 'month' },
        product_data: {
          name: tier.title,
          description: tier.description || `${tier.title} membership`
        }
      });
      
      stripePriceId = price.id;
      
      // Update tier with stripe price ID
      await supabaseService
        .from('membership_tiers')
        .update({ stripe_price_id: stripePriceId })
        .eq('id', tierId);
      
      console.log('Created and saved Stripe price:', stripePriceId);
    }

    // Clean up old pending subscriptions
    console.log('Cleaning up old pending subscriptions...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    await supabaseService
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('creator_id', creatorId)
      .in('status', ['pending', 'incomplete'])
      .lt('created_at', oneHourAgo);

    // Create subscription in Stripe
    console.log('Creating Stripe subscription...');
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: stripePriceId }],
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
        creator_name: tier.creators.display_name,
        platform_fee_percent: '4'
      }
    });

    console.log('Stripe subscription created:', subscription.id, 'Status:', subscription.status);

    // Create subscription record in database
    console.log('Creating subscription record in database...');
    const subscriptionData = {
      user_id: user.id,
      creator_id: creatorId,
      tier_id: tierId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      status: subscription.status,
      amount: tier.price,
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert(subscriptionData);

    if (insertError) {
      console.error('Error creating subscription record:', insertError);
      // If we can't create the record, cancel the Stripe subscription
      try {
        await stripe.subscriptions.cancel(subscription.id);
        console.log('Cancelled Stripe subscription due to database error');
      } catch (cancelError) {
        console.error('Error cancelling subscription:', cancelError);
      }
      return createJsonResponse({ error: 'Failed to create subscription record' }, 500);
    }

    console.log('Subscription record created successfully');

    // Get the client secret from the payment intent
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    
    if (!clientSecret) {
      console.error('No client secret found in subscription');
      return createJsonResponse({ error: 'Failed to get payment client secret' }, 500);
    }

    console.log('Subscription creation successful, returning client secret');

    return createJsonResponse({
      clientSecret: clientSecret,
      amount: Math.round(tier.price * 100),
      tierName: tier.title,
      tierId: tierId,
      creatorId: creatorId,
      paymentIntentId: subscription.latest_invoice?.payment_intent?.id,
      useCustomPaymentPage: true,
      isUpgrade: false,
      fullTierPrice: Math.round(tier.price * 100),
      reusedSession: false
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    console.error('Error stack:', error.stack);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.',
      details: error.message 
    }, 500);
  }
}
