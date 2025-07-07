
import { createJsonResponse } from '../utils/cors.ts';

export async function handleSubscriptionWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[WebhookHandler] Processing subscription webhook:', event.type, event.id);

  const subscription = event.data.object;
  console.log('[WebhookHandler] Received event type:', event.type);
  console.log('[WebhookHandler] Processing subscription:', subscription.id);
  console.log('[WebhookHandler] Stripe subscription status:', subscription.status);
  console.log('[WebhookHandler] Cancel at period end:', subscription.cancel_at_period_end);
  console.log('[WebhookHandler] Subscription metadata:', subscription.metadata);

  const { user_id, creator_id, tier_id } = subscription.metadata;

  console.log('[WebhookHandler] Extracted metadata:', { user_id, creator_id, tier_id });

  if (!user_id || !creator_id || !tier_id) {
    console.error('[WebhookHandler] Missing required metadata in subscription:', subscription.id);
    return createJsonResponse({ error: 'Missing required metadata' }, 400);
  }

  // Handle immediate cancellations (subscription deleted)
  if (event.type === 'customer.subscription.deleted' || subscription.status === 'canceled') {
    console.log('[WebhookHandler] Processing immediate cancellation:', subscription.id);
    
    try {
      // Remove from database for immediate cancellations
      const { error: deleteError } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('stripe_subscription_id', subscription.id);

      if (deleteError) {
        console.error('[WebhookHandler] Error deleting canceled subscription:', deleteError);
        throw deleteError;
      }

      console.log('[WebhookHandler] Successfully removed immediately canceled subscription from database:', subscription.id);
      
      // Clean up legacy subscriptions table
      await supabaseService
        .from('subscriptions')
        .delete()
        .eq('user_id', user_id)
        .eq('creator_id', creator_id);

      return createJsonResponse({ success: true });
    } catch (error) {
      console.error('[WebhookHandler] Error processing immediate cancellation:', error);
      return createJsonResponse({ error: 'Failed to process immediate cancellation' }, 500);
    }
  }

  // Check if subscription record exists and was already activated by payment intent webhook
  const { data: existingSubscription, error: fetchError } = await supabaseService
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[WebhookHandler] Error fetching existing subscription:', fetchError);
    throw fetchError;
  }

  // CRITICAL FIX: If subscription is already active, don't override it
  if (existingSubscription && existingSubscription.status === 'active') {
    console.log('[WebhookHandler] Subscription already active, skipping update to prevent override:', subscription.id);
    return createJsonResponse({ success: true });
  }

  // For incomplete subscriptions, clean them up
  if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    console.log('[WebhookHandler] Subscription is incomplete, handling cleanup:', subscription.id);
    
    // Only delete if it's been incomplete for a while or expired
    if (subscription.status === 'incomplete_expired') {
      try {
        // Delete from Stripe first
        await stripe.subscriptions.del(subscription.id);
        console.log('[WebhookHandler] Successfully deleted incomplete subscription from Stripe:', subscription.id);
      } catch (stripeError) {
        console.error('[WebhookHandler] Error deleting subscription from Stripe:', stripeError);
      }

      try {
        // Remove from database
        await supabaseService
          .from('user_subscriptions')
          .delete()
          .eq('stripe_subscription_id', subscription.id);
        
        console.log('[WebhookHandler] Successfully deleted incomplete subscription from database:', subscription.id);
      } catch (dbError) {
        console.error('[WebhookHandler] Error deleting subscription from database:', dbError);
      }
    } else {
      // For incomplete (but not expired), just update the status
      console.log('[WebhookHandler] Updating incomplete subscription status');
      
      if (existingSubscription) {
        const { error: updateError } = await supabaseService
          .from('user_subscriptions')
          .update({
            status: 'incomplete',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);

        if (updateError) {
          console.error('[WebhookHandler] Error updating incomplete subscription:', updateError);
        }
      }
    }

    return createJsonResponse({ success: true });
  }

  // For new active subscriptions, only create if they don't exist
  if (subscription.status === 'active' && !existingSubscription) {
    console.log('[WebhookHandler] Creating new active subscription record:', subscription.id);
    
    const subscriptionData = {
      user_id,
      creator_id,
      tier_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: 'active',
      amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
        subscription.items.data[0].price.unit_amount / 100 : 5,
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
      console.error('[WebhookHandler] Error inserting new subscription:', insertError);
      throw insertError;
    }

    console.log('[WebhookHandler] Successfully created new active subscription record');
  }

  // Handle subscription updates (like cancellation at period end)
  if (existingSubscription && subscription.status === 'active') {
    console.log('[WebhookHandler] Updating existing active subscription:', subscription.id);
    
    const updateData = {
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseService
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', existingSubscription.id);

    if (updateError) {
      console.error('[WebhookHandler] Error updating subscription:', updateError);
      throw updateError;
    }

    console.log('[WebhookHandler] Successfully updated subscription record');
  }

  // Clean up legacy subscriptions table
  console.log('[WebhookHandler] Cleaning up legacy subscriptions table');
  await supabaseService
    .from('subscriptions')
    .delete()
    .eq('user_id', user_id)
    .eq('creator_id', creator_id);

  console.log('[WebhookHandler] Subscription webhook processing complete');
  return createJsonResponse({ success: true });
}
