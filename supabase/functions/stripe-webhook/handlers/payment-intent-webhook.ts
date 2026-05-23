
import { createJsonResponse } from '../utils/cors.ts';

export async function handlePaymentIntentWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[PaymentIntentWebhook] Processing:', event.type, event.id);

  const paymentIntent = event.data.object;

  // Only process succeeded payment intents
  if (event.type !== 'payment_intent.succeeded' || paymentIntent.status !== 'succeeded') {
    return createJsonResponse({ success: true });
  }

  const { user_id, creator_id, tier_id } = paymentIntent.metadata;

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

    // Get or create Stripe customer
    let stripeCustomerId = paymentIntent.customer;
    if (!stripeCustomerId) {
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
      const priceData = {
        currency: 'usd',
        unit_amount: Math.round(tierPrice * 100),
        recurring: { interval: 'month' },
        product_data: {
          name: `${tierName} Membership`,
          metadata: { tier_id, creator_id }
        },
        metadata: { tier_id, creator_id }
      };

      const stripePrice = await stripe.prices.create(priceData);

      const subscriptionStartTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

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
    } catch (subscriptionError) {
      console.error('[PaymentIntentWebhook] Error creating Stripe subscription:', subscriptionError);
      // Continue without Stripe subscription — the payment already succeeded
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

      console.log('[PaymentIntentWebhook] Updated subscription:', existingSubscription.id);
      return createJsonResponse({ success: true, subscription: updatedData });
    }

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

    const { data: insertedData, error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (insertError) {
      console.error('[PaymentIntentWebhook] Error creating subscription:', insertError);
      throw insertError;
    }

    console.log('[PaymentIntentWebhook] Created subscription:', insertedData?.id);

    // Clean up legacy subscriptions table entries
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id);

    return createJsonResponse({ success: true, subscription: insertedData });

  } catch (error) {
    console.error('[PaymentIntentWebhook] Error processing payment intent webhook:', error);
    return createJsonResponse({
      error: 'Failed to process payment intent webhook',
    }, 500);
  }
}
