
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

    // Create subscription record with active status
    const subscriptionData = {
      user_id,
      creator_id,
      tier_id,
      stripe_customer_id: paymentIntent.customer,
      stripe_subscription_id: null, // Payment intent doesn't have subscription ID
      status: 'active',
      amount: tierPrice,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
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

    // Clean up legacy subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id);

    console.log('[PaymentIntentWebhook] Payment intent webhook processing complete');
    return createJsonResponse({ success: true, subscription: insertedData });

  } catch (error) {
    console.error('[PaymentIntentWebhook] Error processing payment intent webhook:', error);
    console.error('[PaymentIntentWebhook] Error stack:', error.stack);
    return createJsonResponse({ 
      error: 'Failed to process payment intent webhook',
      details: error.message 
    }, 500);
  }
}
