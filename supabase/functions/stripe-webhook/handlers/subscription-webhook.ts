
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

  // For subscription creation or updates to active status
  if (event.type === 'customer.subscription.created' || 
      event.type === 'customer.subscription.updated') {
    console.log('[WebhookHandler] Creating/updating subscription record for:', subscription.id);
    
    // Handle incomplete_expired subscriptions by cleaning them up
    if (subscription.status === 'incomplete_expired') {
      console.log('[WebhookHandler] Subscription is incomplete_expired, cleaning up:', subscription.id);
      
      try {
        // Clean up database record
        await supabaseService
          .from('user_subscriptions')
          .delete()
          .eq('stripe_subscription_id', subscription.id);
        
        console.log('[WebhookHandler] Successfully cleaned up incomplete_expired subscription:', subscription.id);
      } catch (dbError) {
        console.error('[WebhookHandler] Error cleaning up incomplete_expired subscription:', dbError);
      }

      return createJsonResponse({ success: true });
    }

    // Handle incomplete subscriptions - don't create records yet
    if (subscription.status === 'incomplete') {
      console.log('[WebhookHandler] Subscription is incomplete, waiting for payment completion:', subscription.id);
      return createJsonResponse({ success: true });
    }
  }

  // Map Stripe status to our valid statuses
  let dbStatus = 'active';
  if (subscription.status === 'active') {
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
    // Get tier details to ensure we have proper pricing
    const { data: tierData, error: tierError } = await supabaseService
      .from('membership_tiers')
      .select('price')
      .eq('id', tier_id)
      .single();

    if (tierError) {
      console.error('[WebhookHandler] Error fetching tier data:', tierError);
    }

    const tierPrice = tierData?.price || 5; // Default fallback price

    // Check if subscription record exists
    const { data: existingSubscription, error: fetchError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (fetchError) {
      console.error('[WebhookHandler] Error fetching existing subscription:', fetchError);
      // Continue with creation if fetch fails
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
        subscription.items.data[0].price.unit_amount / 100 : tierPrice,
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

      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('[WebhookHandler] Error updating subscription:', updateError);
        throw updateError;
      }

      console.log('[WebhookHandler] Successfully updated existing subscription record');
    } else {
      console.log('[WebhookHandler] Creating new subscription record');
      
      // For new subscriptions, ensure we have all required data
      if (!user_id || !creator_id || !tier_id) {
        console.error('[WebhookHandler] Missing required metadata for new subscription');
        throw new Error('Missing required metadata for subscription creation');
      }
      
      const insertData = {
        ...updateData,
        created_at: new Date().toISOString()
      };

      console.log('[WebhookHandler] Inserting subscription data:', insertData);

      const { data: insertedData, error: insertError } = await supabaseService
        .from('user_subscriptions')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('[WebhookHandler] Error inserting subscription:', insertError);
        console.error('[WebhookHandler] Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }
      
      console.log('[WebhookHandler] Successfully created new subscription record:', insertedData);
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
    console.error('[WebhookHandler] Error stack:', error.stack);
    return createJsonResponse({ 
      error: 'Failed to process subscription webhook',
      details: error.message 
    }, 500);
  }
}
