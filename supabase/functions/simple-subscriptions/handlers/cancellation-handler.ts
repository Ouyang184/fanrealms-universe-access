
export async function handleCancelSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId, immediate }: { tierId: string; creatorId: string; immediate: boolean }
) {
  console.log('[SimpleSubscriptions] Cancelling subscription for tier:', tierId, 'creator:', creatorId, 'immediate:', immediate);
  
  // Find the active subscription in user_subscriptions table
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('status', 'active')
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error('Active subscription not found');
  }

  let canceledSubscription;
  let updateData;

  if (immediate) {
    // Cancel the subscription immediately in Stripe
    canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    
    // Update status to canceled immediately
    updateData = { 
      status: 'canceled' as const,
      cancel_at_period_end: false,
      current_period_end: null,
      cancel_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } else {
    // Set to cancel at period end
    canceledSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });
    
    // Update with cancel at period end info
    updateData = { 
      cancel_at_period_end: true,
      current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  console.log('[SimpleSubscriptions] Updating subscription with data:', updateData);

  await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('id', subscription.id);

  console.log('[SimpleSubscriptions] Successfully cancelled subscription');

  return { 
    success: true,
    creatorId: subscription.creator_id,
    tierId: subscription.tier_id,
    immediate: immediate
  };
}
