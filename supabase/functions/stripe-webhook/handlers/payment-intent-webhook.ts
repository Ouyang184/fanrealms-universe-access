
import { createJsonResponse } from '../utils/cors.ts';

export async function handlePaymentIntentWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[PaymentIntentHandler] Processing payment intent webhook:', event.type, event.id);

  const paymentIntent = event.data.object;
  console.log('[PaymentIntentHandler] Payment Intent ID:', paymentIntent.id);
  console.log('[PaymentIntentHandler] Payment Intent status:', paymentIntent.status);
  console.log('[PaymentIntentHandler] Payment Intent metadata:', paymentIntent.metadata);

  // Only process succeeded payment intents for subscription setup
  if (paymentIntent.status !== 'succeeded') {
    console.log('[PaymentIntentHandler] Payment intent not succeeded, skipping');
    return createJsonResponse({ success: true });
  }

  // Check if this is a subscription setup payment
  if (paymentIntent.metadata.type !== 'subscription_setup') {
    console.log('[PaymentIntentHandler] Not a subscription setup payment, skipping');
    return createJsonResponse({ success: true });
  }

  const { user_id, creator_id, tier_id, tier_name, creator_name } = paymentIntent.metadata;

  if (!user_id || !creator_id || !tier_id) {
    console.error('[PaymentIntentHandler] Missing required metadata in payment intent:', paymentIntent.id);
    return createJsonResponse({ error: 'Missing required metadata' }, 400);
  }

  console.log('[PaymentIntentHandler] Processing subscription setup for:', { user_id, creator_id, tier_id });

  try {
    // Get the payment method used in this payment intent
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
    console.log('[PaymentIntentHandler] Payment method retrieved:', paymentMethod.id);

    // Get tier details for subscription creation
    const { data: tier, error: tierError } = await supabaseService
      .from('membership_tiers')
      .select(`
        *,
        creators!inner(
          stripe_account_id,
          display_name
        )
      `)
      .eq('id', tier_id)
      .single();

    if (tierError || !tier) {
      console.error('[PaymentIntentHandler] Tier not found:', tierError);
      return createJsonResponse({ error: 'Tier not found' }, 404);
    }

    // Use existing Stripe price ID or create one if it doesn't exist
    let stripePriceId = tier.stripe_price_id;
    
    if (!stripePriceId) {
      console.log('[PaymentIntentHandler] No existing price ID found, creating new Stripe price for tier:', tier.title);
      
      try {
        const price = await stripe.prices.create({
          unit_amount: Math.round(tier.price * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: { 
            name: tier.title,
            metadata: {
              tier_id: tier_id,
              creator_id: creator_id
            }
          }
        });
        stripePriceId = price.id;
        console.log('[PaymentIntentHandler] Created new price:', stripePriceId);

        // Update tier with the new stripe_price_id
        await supabaseService
          .from('membership_tiers')
          .update({ 
            stripe_price_id: stripePriceId,
            stripe_product_id: price.product 
          })
          .eq('id', tier_id);
          
        console.log('[PaymentIntentHandler] Updated tier with new price and product IDs');
      } catch (priceError) {
        console.error('[PaymentIntentHandler] Error creating price:', priceError);
        throw new Error('Failed to create Stripe price');
      }
    } else {
      console.log('[PaymentIntentHandler] Using existing Stripe price ID:', stripePriceId);
    }

    // Create the subscription in Stripe
    console.log('[PaymentIntentHandler] Creating Stripe subscription');
    const subscription = await stripe.subscriptions.create({
      customer: paymentIntent.customer,
      items: [{ price: stripePriceId }],
      default_payment_method: paymentMethod.id,
      application_fee_percent: 5,
      transfer_data: { destination: tier.creators.stripe_account_id },
      metadata: {
        user_id,
        creator_id,
        tier_id,
        tier_name,
        creator_name
      }
    });

    console.log('[PaymentIntentHandler] Stripe subscription created:', subscription.id);

    // Create subscription record in database
    const subscriptionData = {
      user_id,
      creator_id,
      tier_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status === 'active' ? 'active' : subscription.status,
      amount: tier.price,
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[PaymentIntentHandler] Creating subscription record:', subscriptionData);

    const { error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert(subscriptionData);

    if (insertError) {
      console.error('[PaymentIntentHandler] Error creating subscription record:', insertError);
      // If we can't create the record, cancel the Stripe subscription
      try {
        await stripe.subscriptions.cancel(subscription.id);
        console.log('[PaymentIntentHandler] Cancelled Stripe subscription due to database error');
      } catch (cancelError) {
        console.error('[PaymentIntentHandler] Error cancelling subscription:', cancelError);
      }
      throw insertError;
    }

    console.log('[PaymentIntentHandler] Successfully created subscription record');

    // Clean up legacy subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id);

    console.log('[PaymentIntentHandler] Payment intent webhook processing complete');
    return createJsonResponse({ success: true });

  } catch (error) {
    console.error('[PaymentIntentHandler] Error processing payment intent webhook:', error);
    return createJsonResponse({ error: 'Failed to process payment intent webhook' }, 500);
  }
}
