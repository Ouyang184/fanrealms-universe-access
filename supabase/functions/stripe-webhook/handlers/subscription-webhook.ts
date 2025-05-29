
export async function handleSubscriptionWebhook(event: any, supabaseService: any) {
  console.log(`[WebhookHandler] Processing subscription webhook: ${event.type} ${event.id}`);
  
  try {
    console.log(`[WebhookHandler] Received event type: ${event.type}`);
    
    const subscription = event.data.object;
    const subscriptionId = subscription.id;
    const customerId = subscription.customer;
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const cancelAt = subscription.cancel_at;
    
    console.log(`[WebhookHandler] Processing subscription: ${subscriptionId}`);
    console.log(`[WebhookHandler] Stripe subscription status: ${status}`);
    console.log(`[WebhookHandler] Cancel at period end: ${cancelAtPeriodEnd}`);
    console.log(`[WebhookHandler] Subscription metadata:`, subscription.metadata);

    // Extract creator_id and other metadata from subscription
    const metadata = subscription.metadata || {};
    const { creator_id, tier_id, user_id } = metadata;
    
    console.log(`[WebhookHandler] Extracted metadata:`, { creator_id, tier_id, user_id });

    // Map Stripe status to our database status
    let dbStatus = 'pending';
    if (status === 'active') {
      dbStatus = cancelAtPeriodEnd ? 'cancelling' : 'active';
    } else if (status === 'trialing') {
      dbStatus = 'active'; // Treat trialing as active
    } else if (['canceled', 'incomplete_expired', 'unpaid'].includes(status)) {
      // For these statuses, we should remove the subscription
      console.log(`[WebhookHandler] Subscription ${subscriptionId} has status ${status}, removing from database`);
      
      const { error: deleteError } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('stripe_subscription_id', subscriptionId);
        
      if (deleteError) {
        console.error(`[WebhookHandler] Error deleting subscription:`, deleteError);
      } else {
        console.log(`[WebhookHandler] Successfully removed subscription ${subscriptionId} from database`);
      }
      return { success: true };
    }

    console.log(`[WebhookHandler] Mapping Stripe status ${status} with cancel_at_period_end: ${cancelAtPeriodEnd} to DB status: ${dbStatus}`);

    // Check if this subscription already exists in our database
    const { data: existingSubscription, error: findError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error(`[WebhookHandler] Error finding existing subscription:`, findError);
      throw findError;
    }

    const updateData = {
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: dbStatus,
      cancel_at_period_end: cancelAtPeriodEnd || false,
      current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      amount: subscription.items?.data?.[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
      updated_at: new Date().toISOString()
    };

    // If we have metadata, include creator_id and other fields
    if (creator_id) {
      updateData.creator_id = creator_id;
    }
    if (tier_id) {
      updateData.tier_id = tier_id;
    }
    if (user_id) {
      updateData.user_id = user_id;
    }

    if (existingSubscription) {
      console.log(`[WebhookHandler] Updating existing subscription record: {
        id: "${existingSubscription.id}",
        currentStatus: "${existingSubscription.status}",
        newStatus: "${dbStatus}",
        stripeSubscriptionId: "${subscriptionId}",
        creatorId: "${creator_id || existingSubscription.creator_id}"
      }`);
      
      console.log(`[WebhookHandler] Update data being applied:`, updateData);
      
      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error(`[WebhookHandler] Error updating existing subscription:`, updateError);
        throw updateError;
      }
    } else {
      console.log(`[WebhookHandler] No existing subscription found for Stripe ID: ${subscriptionId}`);
      // We don't create new subscriptions from webhooks, they should be created during checkout
      // But if we have all the required metadata, we could create it
      if (creator_id && tier_id && user_id) {
        console.log(`[WebhookHandler] Creating new subscription from webhook with complete metadata`);
        const { error: insertError } = await supabaseService
          .from('user_subscriptions')
          .insert({
            ...updateData,
            user_id,
            creator_id,
            tier_id,
            created_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error(`[WebhookHandler] Error creating subscription from webhook:`, insertError);
          throw insertError;
        }
      }
    }

    // Clean up legacy subscriptions table
    console.log(`[WebhookHandler] Cleaning up legacy subscriptions table`);
    if (dbStatus === 'active' && !cancelAtPeriodEnd) {
      // Ensure there's a record in the legacy subscriptions table for active subscriptions
      if (existingSubscription && existingSubscription.creator_id) {
        await supabaseService
          .from('subscriptions')
          .upsert({
            user_id: existingSubscription.user_id,
            creator_id: existingSubscription.creator_id,
            tier_id: existingSubscription.tier_id,
            is_paid: true,
            created_at: existingSubscription.created_at
          }, { 
            onConflict: 'user_id,creator_id',
            ignoreDuplicates: false 
          });
      }
    } else {
      // Remove from legacy subscriptions table if not active or scheduled for cancellation
      if (existingSubscription) {
        await supabaseService
          .from('subscriptions')
          .delete()
          .eq('user_id', existingSubscription.user_id)
          .eq('creator_id', existingSubscription.creator_id);
      }
    }

    console.log(`[WebhookHandler] Subscription webhook processing complete`);
    return { success: true };

  } catch (error) {
    console.error(`[WebhookHandler] Error processing subscription webhook:`, error);
    throw error;
  }
}
