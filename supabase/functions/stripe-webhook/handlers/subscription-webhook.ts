
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleSubscriptionWebhook(
  event: any,
  supabaseService: any
) {
  console.log('[WebhookHandler] Processing subscription webhook:', event.type, event.id);

  const subscription = event.data.object;
  console.log('[WebhookHandler] Subscription data:', {
    id: subscription.id,
    status: subscription.status,
    customer: subscription.customer,
    metadata: subscription.metadata
  });

  if (event.type === 'customer.subscription.created' || 
      event.type === 'customer.subscription.updated') {
    
    console.log('[WebhookHandler] Processing subscription created/updated:', subscription.id);

    // Extract metadata
    const { user_id, creator_id, tier_id } = subscription.metadata || {};
    
    if (!user_id || !creator_id || !tier_id) {
      console.error('[WebhookHandler] Missing metadata:', subscription.metadata);
      return;
    }

    const currentPeriodStart = subscription.current_period_start ? 
      new Date(subscription.current_period_start * 1000).toISOString() : null;
    const currentPeriodEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Determine status based on Stripe subscription status
    let dbStatus = 'pending';
    if (subscription.status === 'active') {
      dbStatus = 'active';
    } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      dbStatus = 'canceled';
    }

    console.log('[WebhookHandler] Updating user_subscriptions with status:', dbStatus);

    // Update or create subscription record in user_subscriptions
    const { error: upsertError } = await supabaseService
      .from('user_subscriptions')
      .upsert({
        user_id,
        creator_id,
        tier_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: dbStatus,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
          subscription.items.data[0].price.unit_amount / 100 : 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_subscription_id'
      });

    if (upsertError) {
      console.error('[WebhookHandler] Error upserting user_subscriptions:', upsertError);
    } else {
      console.log('[WebhookHandler] Successfully updated user_subscriptions:', subscription.id);
    }

    // Clean up any duplicate records for the same user/creator/tier combination
    if (dbStatus === 'active') {
      console.log('[WebhookHandler] Cleaning up duplicate subscriptions');
      const { error: cleanupError } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user_id)
        .eq('creator_id', creator_id)
        .eq('tier_id', tier_id)
        .neq('stripe_subscription_id', subscription.id);

      if (cleanupError) {
        console.error('[WebhookHandler] Error cleaning up duplicates:', cleanupError);
      }
    }

    // Remove from legacy subscriptions table to avoid conflicts
    const { error: legacyCleanupError } = await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id)
      .eq('tier_id', tier_id);

    if (legacyCleanupError) {
      console.error('[WebhookHandler] Error cleaning legacy subscriptions:', legacyCleanupError);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    console.log('[WebhookHandler] Processing subscription deletion:', subscription.id);

    // Mark subscription as canceled in user_subscriptions
    const { error: deleteError } = await supabaseService
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (deleteError) {
      console.error('[WebhookHandler] Error canceling subscription:', deleteError);
    } else {
      console.log('[WebhookHandler] Successfully canceled subscription:', subscription.id);
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      console.log('[WebhookHandler] Processing payment success for subscription:', subscriptionId);

      // Ensure subscription is marked as active when payment succeeds
      const { error: activateError } = await supabaseService
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId);

      if (activateError) {
        console.error('[WebhookHandler] Error activating subscription after payment:', activateError);
      } else {
        console.log('[WebhookHandler] Successfully activated subscription after payment:', subscriptionId);
      }
    }
  }

  console.log('[WebhookHandler] Subscription webhook processing complete');
}
