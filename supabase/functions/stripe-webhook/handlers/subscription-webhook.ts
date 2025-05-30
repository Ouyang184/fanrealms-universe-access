
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

  // Handle incomplete subscriptions by deleting them from Stripe and database
  if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    console.log('[WebhookHandler] Subscription is incomplete, deleting from Stripe and database:', subscription.id);
    
    try {
      // Delete the subscription from Stripe - make sure stripe object is available
      if (stripe && stripe.subscriptions) {
        await stripe.subscriptions.cancel(subscription.id);
        console.log('[WebhookHandler] Successfully deleted incomplete subscription from Stripe:', subscription.id);
      } else {
        console.error('[WebhookHandler] Stripe object not available, skipping Stripe deletion');
      }
    } catch (stripeError) {
      console.error('[WebhookHandler] Error deleting subscription from Stripe:', stripeError);
      // Continue with database cleanup even if Stripe deletion fails
    }

    // Delete from database
    await supabaseService
      .from('user_subscriptions')
      .delete()
      .eq('stripe_subscription_id', subscription.id);

    console.log('[WebhookHandler] Successfully deleted incomplete subscription from database:', subscription.id);
    return createJsonResponse({ success: true, action: 'deleted_incomplete' });
  }

  // Map Stripe status to our valid statuses (active, canceled, incomplete, incomplete_expired)
  let dbStatus = 'active';
  if (subscription.status === 'active') {
    // Keep status as active even if cancel_at_period_end is true
    // The subscription is still active until the period ends
    dbStatus = 'active';
  } else if (subscription.status === 'canceled') {
    dbStatus = 'canceled';
  } else if (subscription.status === 'incomplete') {
    dbStatus = 'incomplete';
  } else if (subscription.status === 'incomplete_expired') {
    dbStatus = 'incomplete_expired';
  } else {
    // For any other status (trialing, past_due, unpaid), treat as active
    dbStatus = 'active';
  }

  console.log('[WebhookHandler] Mapping Stripe status', subscription.status, 'with cancel_at_period_end:', subscription.cancel_at_period_end, 'to DB status:', dbStatus);

  try {
    // Check if subscription record exists
    const { data: existingSubscription, error: fetchError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[WebhookHandler] Error fetching existing subscription:', fetchError);
      throw fetchError;
    }

    const updateData = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: dbStatus,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
        subscription.items.data[0].price.unit_amount / 100 : 5,
      updated_at: new Date().toISOString(),
      creator_id,
      tier_id,
      user_id
    };

    if (existingSubscription) {
      console.log('[WebhookHandler] Updating existing subscription record:', {
        id: existingSubscription.id,
        currentStatus: existingSubscription.status,
        newStatus: dbStatus,
        stripeSubscriptionId: subscription.id,
        creatorId: existingSubscription.creator_id
      });

      console.log('[WebhookHandler] Update data being applied:', updateData);

      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('[WebhookHandler] Error updating subscription:', updateError);
        throw updateError;
      }
    } else {
      console.log('[WebhookHandler] Creating new subscription record');
      
      const { error: insertError } = await supabaseService
        .from('user_subscriptions')
        .insert({
          ...updateData,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[WebhookHandler] Error inserting subscription:', insertError);
        throw insertError;
      }
    }

    // Handle canceled subscriptions - remove from database only if fully canceled (not just scheduled to cancel)
    if (event.type === 'customer.subscription.deleted' || 
        (subscription.status === 'canceled' && !subscription.cancel_at_period_end)) {
      console.log('[WebhookHandler] Subscription', subscription.id, 'has status', subscription.status, ', removing from database');
      
      await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('stripe_subscription_id', subscription.id);

      console.log('[WebhookHandler] Successfully removed subscription', subscription.id, 'from database');
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

  } catch (error) {
    console.error('[WebhookHandler] Error processing subscription webhook:', error);
    return createJsonResponse({ error: 'Failed to process subscription webhook' }, 500);
  }
}
