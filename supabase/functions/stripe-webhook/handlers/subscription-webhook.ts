export async function handleSubscriptionWebhook(stripe: any, supabaseService: any, event: any) {
  console.log(`[WebhookHandler] Processing subscription webhook: ${event.type} ${event.id}`);
  
  try {
    console.log(`[WebhookHandler] Received event type: ${event.type}`);
    
    const subscription = event.data.object;
    const subscriptionId = subscription.id;
    const customerId = subscription.customer;
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const cancelAt = subscription.cancel_at;
    
    console.log(`[WebhookHandler] Processing subscription created/updated: ${subscriptionId}`);
    console.log(`[WebhookHandler] Stripe subscription status: ${status}`);
    console.log(`[WebhookHandler] Cancel at period end: ${cancelAtPeriodEnd}`);
    console.log(`[WebhookHandler] Cancel at: ${cancelAt}`);

    // Map Stripe status to our database status
    let dbStatus = status;
    if (status === 'active' && cancelAtPeriodEnd) {
      // Keep as active but mark for cancellation
      dbStatus = 'active';
      console.log(`[WebhookHandler] Mapping Stripe status ${status} with cancel_at_period_end: ${cancelAtPeriodEnd} to DB status: ${dbStatus}`);
    }

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

    if (existingSubscription) {
      console.log(`[WebhookHandler] Updating existing subscription record: {
        id: "${existingSubscription.id}",
        currentStatus: "${existingSubscription.status}",
        newStatus: "${dbStatus}",
        stripeSubscriptionId: "${subscriptionId}"
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
    }

    // Clean up legacy subscriptions table
    console.log(`[WebhookHandler] Cleaning up legacy subscriptions table`);
    if (status === 'active' && !cancelAtPeriodEnd) {
      // Ensure there's a record in the legacy subscriptions table for active subscriptions
      if (existingSubscription) {
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
          .eq('creator_id', existingSubscription.creator_id)
          .eq('tier_id', existingSubscription.tier_id);
      }
    }

    console.log(`[WebhookHandler] Subscription webhook processing complete`);
    return { success: true };

  } catch (error) {
    console.error(`[WebhookHandler] Error processing subscription webhook:`, error);
    throw error;
  }
}
