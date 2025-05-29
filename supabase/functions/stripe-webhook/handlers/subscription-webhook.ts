
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleSubscriptionWebhook(
  event: any,
  supabaseService: any
) {
  console.log('[WebhookHandler] Received event type:', event.type);
  console.log('[WebhookHandler] Processing subscription webhook:', event.type, event.id);

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      console.log('[WebhookHandler] Processing payment success for subscription:', subscriptionId);
      console.log('[WebhookHandler] Invoice details:', {
        id: invoice.id,
        status: invoice.status,
        amount_paid: invoice.amount_paid,
        customer: invoice.customer,
        subscription: invoice.subscription
      });

      // CRITICAL FIX: Find and activate subscription when payment succeeds
      console.log('[WebhookHandler] Searching for subscription with stripe_subscription_id:', subscriptionId);
      
      const { data: subscriptionToUpdate, error: findError } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      console.log('[WebhookHandler] Query result for finding subscription:', {
        data: subscriptionToUpdate,
        error: findError,
        searchedId: subscriptionId
      });

      if (findError) {
        console.error('[WebhookHandler] Error finding subscription:', findError);
        return;
      }

      if (!subscriptionToUpdate) {
        console.error('[WebhookHandler] No subscription found with stripe_subscription_id:', subscriptionId);
        return;
      }

      console.log('[WebhookHandler] Found subscription to activate:', {
        id: subscriptionToUpdate.id,
        user_id: subscriptionToUpdate.user_id,
        current_status: subscriptionToUpdate.status,
        stripe_subscription_id: subscriptionToUpdate.stripe_subscription_id
      });

      // Update subscription to active status
      const updateData = { 
        status: 'active',
        updated_at: new Date().toISOString()
      };

      console.log('[WebhookHandler] Updating subscription with data:', updateData);

      const { data: updatedSubscription, error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscriptionToUpdate.id)
        .select()
        .single();

      console.log('[WebhookHandler] Update query result:', {
        data: updatedSubscription,
        error: updateError,
        updatedId: subscriptionToUpdate.id
      });

      if (updateError) {
        console.error('[WebhookHandler] Error updating subscription to active:', updateError);
      } else if (!updatedSubscription) {
        console.error('[WebhookHandler] No rows were updated — check if subscription ID exists in DB');
      } else {
        console.log('[WebhookHandler] Successfully activated subscription:', {
          subscription_id: subscriptionId,
          database_id: updatedSubscription.id,
          new_status: updatedSubscription.status,
          user_id: updatedSubscription.user_id,
          previous_status: subscriptionToUpdate.status
        });
      }
    }
  }

  if (event.type === 'customer.subscription.created' || 
      event.type === 'customer.subscription.updated') {
    
    const subscription = event.data.object;
    console.log('[WebhookHandler] Processing subscription created/updated:', subscription.id);
    console.log('[WebhookHandler] Stripe subscription status:', subscription.status);
    console.log('[WebhookHandler] Cancel at period end:', subscription.cancel_at_period_end);
    console.log('[WebhookHandler] Cancel at:', subscription.cancel_at);

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

    // Better status mapping - handle cancelling status
    let dbStatus = 'pending';
    if (subscription.status === 'active') {
      // Check if it's set to cancel at period end
      if (subscription.cancel_at_period_end) {
        dbStatus = 'cancelling';
      } else {
        dbStatus = 'active';
      }
    } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      dbStatus = 'canceled';
    } else if (subscription.status === 'trialing') {
      dbStatus = 'active';
    } else {
      // For any other status (past_due, unpaid, etc.), keep as pending
      dbStatus = 'pending';
    }

    console.log('[WebhookHandler] Mapping Stripe status', subscription.status, 'with cancel_at_period_end:', subscription.cancel_at_period_end, 'to DB status:', dbStatus);

    // First, try to find existing record
    const { data: existingRecord, error: findError } = await supabaseService
      .from('user_subscriptions')
      .select('id, status')
      .eq('user_id', user_id)
      .eq('creator_id', creator_id)
      .eq('tier_id', tier_id)
      .maybeSingle();

    if (findError) {
      console.error('[WebhookHandler] Error finding existing subscription:', findError);
    }

    if (existingRecord) {
      // CRITICAL FIX: Don't overwrite active status with pending
      if (existingRecord.status === 'active' && dbStatus === 'pending') {
        console.log('[WebhookHandler] Preserving active status, skipping overwrite of active status with pending');
        console.log('[WebhookHandler] Existing record status:', existingRecord.status, 'New status would be:', dbStatus);
        return;
      }

      // Update existing record
      console.log('[WebhookHandler] Updating existing subscription record:', {
        id: existingRecord.id,
        currentStatus: existingRecord.status,
        newStatus: dbStatus,
        stripeSubscriptionId: subscription.id
      });

      const updateData = {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: dbStatus,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
          subscription.items.data[0].price.unit_amount / 100 : 0,
        updated_at: new Date().toISOString()
      };

      console.log('[WebhookHandler] Update data being applied:', updateData);

      const { data: updatedData, error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', existingRecord.id)
        .select();

      if (updateError) {
        console.error('[WebhookHandler] Error updating existing subscription:', updateError);
      } else {
        console.log('[WebhookHandler] Successfully updated existing subscription:', {
          subscriptionId: subscription.id,
          recordId: existingRecord.id,
          updatedData: updatedData?.[0]
        });
      }
    } else {
      // Insert new record
      console.log('[WebhookHandler] Creating new subscription record');
      
      const insertData = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[WebhookHandler] Insert data being applied:', insertData);

      const { data: insertedData, error: insertError } = await supabaseService
        .from('user_subscriptions')
        .insert(insertData)
        .select();

      if (insertError) {
        console.error('[WebhookHandler] Error inserting new subscription:', insertError);
      } else {
        console.log('[WebhookHandler] Successfully created new subscription:', {
          subscriptionId: subscription.id,
          insertedData: insertedData?.[0]
        });
      }
    }

    // Clean up legacy subscriptions table completely
    console.log('[WebhookHandler] Cleaning up legacy subscriptions table');
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
    const subscription = event.data.object;
    console.log('[WebhookHandler] Processing subscription deletion:', subscription.id);

    // Mark subscription as canceled in user_subscriptions ONLY
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

  console.log('[WebhookHandler] Subscription webhook processing complete');
}
