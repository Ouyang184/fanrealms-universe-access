
export async function handleCancelSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId, immediate }: { tierId: string; creatorId: string; immediate: boolean }
) {
  console.log('[SimpleSubscriptions] Cancelling subscription for tier:', tierId, 'creator:', creatorId, 'immediate:', immediate);
  
  // Find the active subscription in user_subscriptions table
  const { data: subscription, error: findError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('status', 'active')
    .maybeSingle();

  if (findError) {
    console.error('[SimpleSubscriptions] Error finding subscription:', findError);
    throw new Error('Failed to find subscription');
  }

  if (!subscription) {
    console.error('[SimpleSubscriptions] No active subscription found');
    throw new Error('Active subscription not found');
  }

  console.log('[SimpleSubscriptions] Found subscription:', {
    id: subscription.id,
    stripe_subscription_id: subscription.stripe_subscription_id
  });

  let canceledSubscription;
  let updateData;

  if (immediate) {
    // === IMMEDIATE CANCELLATION ===
    console.log('[SimpleSubscriptions] === EXECUTING IMMEDIATE CANCELLATION ===');

    // Only cancel in Stripe if we have a Stripe subscription ID
    if (subscription.stripe_subscription_id) {
      try {
        console.log('[SimpleSubscriptions] Cancelling Stripe subscription:', subscription.stripe_subscription_id);
        canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        console.log('[SimpleSubscriptions] Successfully cancelled Stripe subscription');
      } catch (stripeError) {
        console.error('[SimpleSubscriptions] Stripe cancellation failed:', stripeError);
        // Continue with database deletion even if Stripe fails for immediate cancellation
        console.log('[SimpleSubscriptions] Proceeding with database deletion despite Stripe error');
      }
    } else {
      console.log('[SimpleSubscriptions] No Stripe subscription ID, proceeding with database-only cancellation');
    }

    // Delete from database for immediate cancellation
    const { error: deleteError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('id', subscription.id);

    if (deleteError) {
      console.error('[SimpleSubscriptions] Error deleting subscription:', deleteError);
      throw new Error('Database deletion failed');
    }

    console.log('[SimpleSubscriptions] Successfully deleted subscription from database');

  } else {
    // === DELAYED CANCELLATION ===
    console.log('[SimpleSubscriptions] === EXECUTING DELAYED CANCELLATION ===');

    let currentPeriodEnd = subscription.current_period_end;

    // Only update in Stripe if we have a Stripe subscription ID
    if (subscription.stripe_subscription_id) {
      try {
        console.log('[SimpleSubscriptions] Updating Stripe subscription for delayed cancellation:', subscription.stripe_subscription_id);
        canceledSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
        currentPeriodEnd = new Date(canceledSubscription.current_period_end * 1000).toISOString();
        console.log('[SimpleSubscriptions] Successfully updated Stripe subscription');
      } catch (stripeError) {
        console.error('[SimpleSubscriptions] Stripe update failed:', stripeError);
        throw new Error(stripeError?.message || 'Stripe update failed');
      }
    } else {
      console.log('[SimpleSubscriptions] No Stripe subscription ID, updating local subscription only');
      // Use existing period end or default to 30 days
      if (!currentPeriodEnd) {
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    // Update with cancel at period end info
    updateData = { 
      cancel_at_period_end: true,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString()
    };

    console.log('[SimpleSubscriptions] Updating subscription with data:', updateData);

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    if (updateError) {
      console.error('[SimpleSubscriptions] Error updating subscription:', updateError);
      throw new Error('Database update failed');
    }
  }

  console.log('[SimpleSubscriptions] Successfully cancelled subscription');

  return { 
    success: true,
    creatorId: subscription.creator_id,
    tierId: subscription.tier_id,
    immediate: immediate,
    canceled_at: immediate ? (canceledSubscription?.canceled_at || Math.floor(Date.now() / 1000)) : null,
    cancel_at: !immediate && canceledSubscription ? canceledSubscription.current_period_end * 1000 : null
  };
}
