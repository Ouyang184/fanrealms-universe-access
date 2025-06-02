
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCheckoutWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[CheckoutHandler] Processing checkout session completed:', event.id);

  const session = event.data.object;
  console.log('[CheckoutHandler] Session ID:', session.id);
  console.log('[CheckoutHandler] Customer ID:', session.customer);
  console.log('[CheckoutHandler] Subscription ID:', session.subscription);

  if (!session.subscription) {
    console.log('[CheckoutHandler] No subscription in session, skipping');
    return createJsonResponse({ success: true });
  }

  try {
    // Get the subscription from Stripe to access metadata
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('[CheckoutHandler] Retrieved subscription:', subscription.id);
    console.log('[CheckoutHandler] Subscription metadata:', subscription.metadata);

    const { user_id, creator_id, tier_id, existing_subscription_id, action } = subscription.metadata;

    if (!user_id || !creator_id || !tier_id) {
      console.error('[CheckoutHandler] Missing required metadata in subscription:', subscription.id);
      return createJsonResponse({ error: 'Missing required metadata' }, 400);
    }

    // Handle tier change (upgrade/downgrade)
    if (action === 'tier_change' && existing_subscription_id) {
      console.log('[CheckoutHandler] Processing tier change from subscription:', existing_subscription_id, 'to new subscription:', subscription.id);
      
      try {
        // Cancel the old subscription
        await stripe.subscriptions.cancel(existing_subscription_id);
        console.log('[CheckoutHandler] Cancelled old subscription:', existing_subscription_id);

        // Remove old subscription from database
        await supabaseService
          .from('user_subscriptions')
          .delete()
          .eq('stripe_subscription_id', existing_subscription_id);

        console.log('[CheckoutHandler] Removed old subscription from database');
      } catch (error) {
        console.error('[CheckoutHandler] Error handling old subscription:', error);
        // Continue with new subscription creation even if old cleanup fails
      }
    }

    // Create/update subscription record in database
    const subscriptionData = {
      user_id,
      creator_id,
      tier_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: 'active',
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
        subscription.items.data[0].price.unit_amount / 100 : 0,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[CheckoutHandler] Creating subscription record:', subscriptionData);

    const { error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert(subscriptionData);

    if (insertError) {
      console.error('[CheckoutHandler] Error creating subscription record:', insertError);
      throw insertError;
    }

    console.log('[CheckoutHandler] Successfully created subscription record');

    // Clean up legacy subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id);

    console.log('[CheckoutHandler] Checkout webhook processing complete');
    return createJsonResponse({ success: true });

  } catch (error) {
    console.error('[CheckoutHandler] Error processing checkout webhook:', error);
    return createJsonResponse({ error: 'Failed to process checkout webhook' }, 500);
  }
}
