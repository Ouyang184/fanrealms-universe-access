
import { createJsonResponse } from '../utils/cors.ts';

export async function handlePaymentIntentWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[PaymentIntentWebhook] Processing payment intent webhook:', event.type, event.id);

  const paymentIntent = event.data.object;
  console.log('[PaymentIntentWebhook] Payment Intent:', paymentIntent.id);
  console.log('[PaymentIntentWebhook] Payment Intent status:', paymentIntent.status);
  console.log('[PaymentIntentWebhook] Payment Intent metadata:', paymentIntent.metadata);

  // Only process succeeded payment intents
  if (event.type !== 'payment_intent.succeeded' || paymentIntent.status !== 'succeeded') {
    console.log('[PaymentIntentWebhook] Not a succeeded payment intent, skipping');
    return createJsonResponse({ success: true });
  }

  const { user_id, creator_id, tier_id } = paymentIntent.metadata;

  console.log('[PaymentIntentWebhook] Extracted metadata:', { user_id, creator_id, tier_id });

  if (!user_id || !creator_id || !tier_id) {
    console.error('[PaymentIntentWebhook] Missing required metadata in payment intent:', paymentIntent.id);
    return createJsonResponse({ error: 'Missing required metadata' }, 400);
  }

  try {
    // Get tier details to ensure we have proper pricing
    const { data: tierData, error: tierError } = await supabaseService
      .from('membership_tiers')
      .select('title, price')
      .eq('id', tier_id)
      .single();

    if (tierError) {
      console.error('[PaymentIntentWebhook] Error fetching tier data:', tierError);
      throw tierError;
    }

    const tierPrice = tierData?.price || 5;
    const tierName = tierData?.title || 'Unknown Tier';

    console.log('[PaymentIntentWebhook] Tier details:', { tierName, tierPrice });

    // Get or create Stripe customer
    let stripeCustomerId = paymentIntent.customer;
    if (!stripeCustomerId) {
      console.log('[PaymentIntentWebhook] No customer in payment intent, fetching from database');
      
      const { data: userData } = await supabaseService.auth.admin.getUserById(user_id);
      if (userData?.user?.email) {
        const customers = await stripe.customers.list({ 
          email: userData.user.email, 
          limit: 1 
        });
        
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
        } else {
          const newCustomer = await stripe.customers.create({
            email: userData.user.email,
            metadata: { user_id }
          });
          stripeCustomerId = newCustomer.id;
        }
      }
    }

    // Create a proper Stripe subscription for ongoing management
    let stripeSubscriptionId = null;
    try {
      console.log('[PaymentIntentWebhook] Creating Stripe subscription for customer:', stripeCustomerId);
      
      // First, find or create a price for this tier
      const priceData = {
        currency: 'usd',
        unit_amount: Math.round(tierPrice * 100), // Convert to cents
        recurring: { interval: 'month' },
        product_data: {
          name: `${tierName} Membership`,
          metadata: {
            tier_id,
            creator_id
          }
        },
        metadata: {
          tier_id,
          creator_id
        }
      };

      const stripePrice = await stripe.prices.create(priceData);
      console.log('[PaymentIntentWebhook] Created Stripe price:', stripePrice.id);

      // Create the subscription starting from next billing cycle since payment already succeeded
      const subscriptionStartTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Start tomorrow
      const subscriptionEndTime = subscriptionStartTime + (30 * 24 * 60 * 60); // 30 days later

      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePrice.id }],
        billing_cycle_anchor: subscriptionStartTime,
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id,
          creator_id,
          tier_id,
          initial_payment_intent_id: paymentIntent.id
        }
      });

      stripeSubscriptionId = stripeSubscription.id;
      console.log('[PaymentIntentWebhook] Created Stripe subscription:', stripeSubscriptionId);
    } catch (subscriptionError) {
      console.error('[PaymentIntentWebhook] Error creating Stripe subscription:', subscriptionError);
      // Continue without Stripe subscription - the payment already succeeded
    }

    // Check for existing subscription to update or create new one
    const { data: existingSubscription } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('creator_id', creator_id)
      .eq('tier_id', tier_id)
      .maybeSingle();

    if (existingSubscription) {
      // Update existing subscription
      console.log('[PaymentIntentWebhook] Updating existing subscription:', existingSubscription.id);
      
      const updateData = {
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        status: 'active',
        amount: tierPrice,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      };

      const { data: updatedData, error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error('[PaymentIntentWebhook] Error updating subscription:', updateError);
        throw updateError;
      }

      console.log('[PaymentIntentWebhook] Successfully updated subscription record:', updatedData);
      return createJsonResponse({ success: true, subscription: updatedData });
    } else {
      // Create new subscription record
      const subscriptionData = {
        user_id,
        creator_id,
        tier_id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        status: 'active',
        amount: tierPrice,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[PaymentIntentWebhook] Creating subscription record:', subscriptionData);

      const { data: insertedData, error: insertError } = await supabaseService
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (insertError) {
        console.error('[PaymentIntentWebhook] Error creating subscription:', insertError);
        throw insertError;
      }

      console.log('[PaymentIntentWebhook] Successfully created subscription record:', insertedData);
    }

    // Clean up legacy subscriptions table entries
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id);

    console.log('[PaymentIntentWebhook] Payment intent webhook processing complete');
    return createJsonResponse({ success: true, subscription: insertedData || updatedData });

  } catch (error) {
    console.error('[PaymentIntentWebhook] Error processing payment intent webhook:', error);
    console.error('[PaymentIntentWebhook] Error stack:', error.stack);
    return createJsonResponse({ 
      error: 'Failed to process payment intent webhook',
      details: error.message 
    }, 500);
  }
}
