
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

  // For new subscriptions, create the database record immediately
  if (event.type === 'customer.subscription.created' || 
      (event.type === 'customer.subscription.updated' && subscription.status === 'active')) {
    console.log('[WebhookHandler] Creating/updating subscription record for:', subscription.id);
  } else if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    console.log('[WebhookHandler] Subscription appears incomplete, checking if payment was already processed...');
    
    // CRITICAL FIX: Check if payment intent webhook already activated this subscription
    const { data: existingRecord, error: checkError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (!checkError && existingRecord && existingRecord.status === 'active') {
      console.log('[WebhookHandler] PREVENTING DELETION: Subscription already activated by payment intent webhook, skipping incomplete handling');
      // Continue with normal processing instead of deleting
    } else {
      console.log('[WebhookHandler] Subscription is truly incomplete, deleting from Stripe and database:', subscription.id);
      
      try {
        // Delete from Stripe first
        await stripe.subscriptions.del(subscription.id);
        console.log('[WebhookHandler] Successfully deleted incomplete subscription from Stripe:', subscription.id);
      } catch (stripeError) {
        console.error('[WebhookHandler] Error deleting subscription from Stripe:', stripeError);
        // Continue to clean up database even if Stripe deletion fails
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

      return createJsonResponse({ success: true });
    }
  }

  // Check if subscription record exists first to determine proper status handling
  const { data: existingSubscription, error: fetchError } = await supabaseService
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[WebhookHandler] Error fetching existing subscription:', fetchError);
    throw fetchError;
  }

  // Map Stripe status to our valid statuses
  let dbStatus = 'active';
  if (subscription.status === 'active') {
    dbStatus = 'active';
  } else if (subscription.status === 'canceled') {
    dbStatus = 'canceled';
  } else if (subscription.status === 'incomplete') {
    // CRITICAL FIX: Don't override active status if payment intent webhook already set it to active
    if (existingSubscription && existingSubscription.status === 'active') {
      console.log('[WebhookHandler] PREVENTING STATUS OVERRIDE: Existing subscription is already active, keeping active status despite Stripe incomplete status');
      dbStatus = 'active';
    } else {
      dbStatus = 'incomplete';
    }
  } else if (subscription.status === 'incomplete_expired') {
    dbStatus = 'incomplete_expired';
  } else {
    // For any other status (trialing, past_due, unpaid), treat as active
    dbStatus = 'active';
  }

  console.log('[WebhookHandler] Mapping Stripe status', subscription.status, 'with cancel_at_period_end:', subscription.cancel_at_period_end, 'to DB status:', dbStatus);
  if (existingSubscription) {
    console.log('[WebhookHandler] Existing subscription status:', existingSubscription.status, '-> New status:', dbStatus);
  }

  try {

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

    // For immediate cancellations, add cancel_at timestamp and clear period end
    if (dbStatus === 'canceled' && !subscription.cancel_at_period_end) {
      updateData.cancel_at = new Date().toISOString();
      updateData.current_period_end = null;
    }

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
      
      // For new subscriptions, ensure we have all required data
      if (!user_id || !creator_id || !tier_id) {
        console.error('[WebhookHandler] Missing required metadata for new subscription');
        throw new Error('Missing required metadata for subscription creation');
      }
      
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
      
      console.log('[WebhookHandler] Successfully created new subscription record');
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
