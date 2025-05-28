import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleSubscriptionWebhook(
  event: any,
  supabaseService: any
) {
  console.log('[WebhookHandler] Processing subscription webhook:', event.type, event.id);

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    
    if (subscriptionId) {
      console.log('[WebhookHandler] Processing payment success for subscription:', subscriptionId);
      console.log('[WebhookHandler] Invoice status:', invoice.status, 'Amount paid:', invoice.amount_paid);

      // CRITICAL FIX: Ensure subscription is marked as active when payment succeeds
      const { data: updateData, error: activateError } = await supabaseService
        .from('user_subscriptions')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)
        .select();

      if (activateError) {
        console.error('[WebhookHandler] Error activating subscription after payment:', activateError);
      } else {
        console.log('[WebhookHandler] Successfully activated subscription after payment:', subscriptionId, 'Updated rows:', updateData?.length || 0);
        
        // Log the updated subscription data for debugging
        if (updateData && updateData.length > 0) {
          console.log('[WebhookHandler] Updated subscription data:', updateData[0]);
        }
      }
    }
  }

  if (event.type === 'customer.subscription.created' || 
      event.type === 'customer.subscription.updated') {
    
    const subscription = event.data.object;
    console.log('[WebhookHandler] Processing subscription created/updated:', subscription.id);
    console.log('[WebhookHandler] Stripe subscription status:', subscription.status);

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

    // IMPROVED: Better status mapping
    let dbStatus = 'pending';
    if (subscription.status === 'active') {
      dbStatus = 'active';
    } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      dbStatus = 'canceled';
    } else if (subscription.status === 'incomplete') {
      // Keep as pending until first payment succeeds
      dbStatus = 'pending';
    } else if (subscription.status === 'trialing') {
      // Trial period should be considered active
      dbStatus = 'active';
    }

    console.log('[WebhookHandler] Mapping Stripe status', subscription.status, 'to DB status:', dbStatus);

    // First, try to update existing record
    const { data: existingRecord, error: findError } = await supabaseService
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('creator_id', creator_id)
      .eq('tier_id', tier_id)
      .maybeSingle();

    if (findError) {
      console.error('[WebhookHandler] Error finding existing subscription:', findError);
    }

    if (existingRecord) {
      // Update existing record
      console.log('[WebhookHandler] Updating existing subscription record:', existingRecord.id);
      const { data: updatedData, error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update({
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: dbStatus,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
            subscription.items.data[0].price.unit_amount / 100 : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select();

      if (updateError) {
        console.error('[WebhookHandler] Error updating existing subscription:', updateError);
      } else {
        console.log('[WebhookHandler] Successfully updated existing subscription:', subscription.id);
        console.log('[WebhookHandler] Updated subscription data:', updatedData?.[0]);
      }
    } else {
      // Insert new record
      console.log('[WebhookHandler] Creating new subscription record');
      const { data: insertedData, error: insertError } = await supabaseService
        .from('user_subscriptions')
        .insert({
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
        })
        .select();

      if (insertError) {
        console.error('[WebhookHandler] Error inserting new subscription:', insertError);
      } else {
        console.log('[WebhookHandler] Successfully created new subscription:', subscription.id);
        console.log('[WebhookHandler] Inserted subscription data:', insertedData?.[0]);
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
