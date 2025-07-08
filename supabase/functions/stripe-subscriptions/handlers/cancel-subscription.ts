import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCancelSubscription(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('[CancelSubscription] === STARTING SUBSCRIPTION CANCELLATION ===');
  console.log('[CancelSubscription] User ID:', user.id);
  console.log('[CancelSubscription] Request body:', JSON.stringify(body, null, 2));

  const { subscriptionId, tierId, creatorId, immediate = false } = body;

  // Create service client for database operations
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    let stripeSubscriptionId = subscriptionId;

    // If no subscriptionId provided, look it up by tierId and creatorId
    if (!stripeSubscriptionId && tierId && creatorId) {
      console.log('[CancelSubscription] Looking up subscription by tier and creator');
      const { data: subscription, error } = await supabaseService
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .eq('tier_id', tierId)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .single();

      if (error || !subscription) {
        console.error('[CancelSubscription] Subscription not found:', error);
        return createJsonResponse({ error: 'Active subscription not found' }, 404);
      }

      stripeSubscriptionId = subscription.stripe_subscription_id;
    }

    if (!stripeSubscriptionId) {
      return createJsonResponse({ error: 'Subscription ID is required' }, 400);
    }

    console.log('[CancelSubscription] Cancelling Stripe subscription:', stripeSubscriptionId);

    // Cancel the subscription in Stripe
    const cancelledSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: !immediate,
      ...(immediate && { cancel_at: Math.floor(Date.now() / 1000) })
    });

    console.log('[CancelSubscription] Stripe subscription updated:', cancelledSubscription.id);

    // Update the database record
    const updateData = immediate ? {
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    } : {
      cancel_at_period_end: true,
      updated_at: new Date().toISOString()
    };

    await supabaseService
      .from('user_subscriptions')
      .update(updateData)
      .eq('stripe_subscription_id', stripeSubscriptionId);

    console.log('[CancelSubscription] Database updated successfully');

    return createJsonResponse({
      success: true,
      cancelled: immediate,
      cancel_at_period_end: !immediate,
      cancel_at: cancelledSubscription.cancel_at,
      current_period_end: cancelledSubscription.current_period_end
    });

  } catch (error) {
    console.error('[CancelSubscription] Error:', error);
    return createJsonResponse({ 
      error: 'Failed to cancel subscription. Please try again later.' 
    }, 500);
  }
}