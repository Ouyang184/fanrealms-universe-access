
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

  // Handle specific subscription events
  switch (event.type) {
    case 'customer.subscription.created':
      console.log('[WebhookHandler] Processing subscription creation:', subscription.id);
      return await handleSubscriptionCreated(subscription, supabaseService);
      
    case 'customer.subscription.paused':
      console.log('[WebhookHandler] Processing subscription pause:', subscription.id);
      return await handleSubscriptionPaused(subscription, supabaseService);
      
    case 'customer.subscription.resumed':
      console.log('[WebhookHandler] Processing subscription resume:', subscription.id);
      return await handleSubscriptionResumed(subscription, supabaseService);
      
    case 'customer.subscription.deleted':
      console.log('[WebhookHandler] Processing subscription deletion:', subscription.id);
      return await handleSubscriptionDeleted(subscription, supabaseService);
      
    case 'customer.subscription.updated':
      console.log('[WebhookHandler] Processing subscription update:', subscription.id);
      return await handleSubscriptionUpdated(subscription, supabaseService, stripe);
      
    default:
      console.log('[WebhookHandler] Fallback processing for event:', event.type);
      return await handleSubscriptionUpdated(subscription, supabaseService, stripe);
  }
}

async function handleSubscriptionCreated(subscription: any, supabaseService: any) {
  const { user_id, creator_id, tier_id } = subscription.metadata;
  
  const subscriptionData = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    status: 'active',
    cancel_at_period_end: false,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
      subscription.items.data[0].price.unit_amount / 100 : 5,
    creator_id,
    tier_id,
    user_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseService
    .from('user_subscriptions')
    .insert(subscriptionData);

  if (error) {
    console.error('[WebhookHandler] Error creating subscription:', error);
    return createJsonResponse({ error: 'Failed to create subscription' }, 500);
  }

  console.log('[WebhookHandler] Successfully created subscription:', subscription.id);
  return createJsonResponse({ success: true, action: 'created' });
}

async function handleSubscriptionPaused(subscription: any, supabaseService: any) {
  const { error } = await supabaseService
    .from('user_subscriptions')
    .update({ 
      status: 'paused',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[WebhookHandler] Error pausing subscription:', error);
    return createJsonResponse({ error: 'Failed to pause subscription' }, 500);
  }

  console.log('[WebhookHandler] Successfully paused subscription:', subscription.id);
  return createJsonResponse({ success: true, action: 'paused' });
}

async function handleSubscriptionResumed(subscription: any, supabaseService: any) {
  const { error } = await supabaseService
    .from('user_subscriptions')
    .update({ 
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[WebhookHandler] Error resuming subscription:', error);
    return createJsonResponse({ error: 'Failed to resume subscription' }, 500);
  }

  console.log('[WebhookHandler] Successfully resumed subscription:', subscription.id);
  return createJsonResponse({ success: true, action: 'resumed' });
}

async function handleSubscriptionDeleted(subscription: any, supabaseService: any) {
  const { user_id, creator_id } = subscription.metadata;

  // Remove from database for immediate cancellations
  const { error: deleteError } = await supabaseService
    .from('user_subscriptions')
    .delete()
    .eq('stripe_subscription_id', subscription.id);

  if (deleteError) {
    console.error('[WebhookHandler] Error deleting canceled subscription:', deleteError);
    return createJsonResponse({ error: 'Failed to delete subscription' }, 500);
  }

  // Clean up legacy subscriptions table
  await supabaseService
    .from('subscriptions')
    .delete()
    .eq('user_id', user_id)
    .eq('creator_id', creator_id);

  console.log('[WebhookHandler] Successfully deleted subscription:', subscription.id);
  return createJsonResponse({ success: true, action: 'deleted' });
}

async function handleSubscriptionUpdated(subscription: any, supabaseService: any, stripe: any) {
  const { user_id, creator_id, tier_id } = subscription.metadata;

  // AUTO-DELETE INCOMPLETE SUBSCRIPTIONS
  if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    console.log('[WebhookHandler] Subscription is incomplete, deleting from Stripe and database:', subscription.id);
    
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

    return createJsonResponse({ success: true, action: 'incomplete_deleted' });
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
