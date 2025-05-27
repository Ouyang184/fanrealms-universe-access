import { createJsonResponse } from '../utils/cors.ts';

export async function handleCancelSubscription(
  stripe: any,
  supabaseService: any,
  user: any,
  subscriptionId: string
) {
  console.log('Cancelling subscription:', subscriptionId);

  if (!subscriptionId) {
    console.log('ERROR: Missing subscriptionId');
    return createJsonResponse({ error: 'Missing subscription ID' }, 400);
  }

  // First try to find subscription in creator_subscriptions table
  console.log('Looking for subscription in creator_subscriptions table...');
  const { data: creatorSubscription, error: creatorSubError } = await supabaseService
    .from('creator_subscriptions')
    .select('stripe_subscription_id, id, user_id, creator_id, status, current_period_end')
    .eq('user_id', user.id)
    .eq('id', subscriptionId)
    .maybeSingle();

  if (creatorSubError) {
    console.error('Error querying creator_subscriptions:', creatorSubError);
  }

  // If not found in creator_subscriptions, try subscriptions table
  let subscriptionData = creatorSubscription;
  let isCreatorSubscription = true;

  if (!creatorSubscription) {
    console.log('Not found in creator_subscriptions, checking subscriptions table...');
    const { data: basicSubscription, error: basicSubError } = await supabaseService
      .from('subscriptions')
      .select('id, user_id, creator_id, tier_id, is_paid')
      .eq('user_id', user.id)
      .eq('id', subscriptionId)
      .maybeSingle();

    if (basicSubError) {
      console.error('Error querying subscriptions:', basicSubError);
    }

    if (basicSubscription) {
      subscriptionData = basicSubscription;
      isCreatorSubscription = false;
      console.log('Found subscription in subscriptions table:', subscriptionData);
    }
  }

  if (!subscriptionData) {
    console.log('ERROR: Subscription not found for user:', user.id, 'subscription ID:', subscriptionId);
    return createJsonResponse({ error: 'Subscription not found or already cancelled' }, 404);
  }

  console.log('Found subscription:', subscriptionData);

  // Cancel Stripe subscription if we have a stripe_subscription_id (only for creator_subscriptions)
  if (isCreatorSubscription && subscriptionData.stripe_subscription_id) {
    try {
      console.log('Cancelling Stripe subscription at period end:', subscriptionData.stripe_subscription_id);
      
      // Cancel at period end to honor billing cycle
      const cancelledSubscription = await stripe.subscriptions.update(
        subscriptionData.stripe_subscription_id,
        {
          cancel_at_period_end: true
        }
      );
      
      console.log('Stripe subscription cancelled at period end successfully');
      console.log('Current period ends at:', new Date(cancelledSubscription.current_period_end * 1000));

      // Update creator_subscriptions table - keep active but mark for cancellation
      const { error: updateError } = await supabaseService
        .from('creator_subscriptions')
        .update({ 
          status: 'cancelling', // New status to indicate cancellation scheduled
          cancel_at: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (updateError) {
        console.error('Error updating creator_subscriptions status:', updateError);
        return createJsonResponse({ error: 'Failed to update subscription status' }, 500);
      }

      console.log('Subscription marked for cancellation at period end');

    } catch (stripeError) {
      console.error('Error cancelling Stripe subscription:', stripeError);
      return createJsonResponse({ error: 'Failed to cancel subscription' }, 500);
    }
  } else {
    // Handle basic subscription (no Stripe integration) - immediate cancellation
    console.log('Handling basic subscription cancellation (no Stripe)');
    
    // Just remove from subscriptions table
    const { error: deleteError } = await supabaseService
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error removing subscription from subscriptions table:', deleteError);
      return createJsonResponse({ error: 'Failed to remove subscription' }, 500);
    }

    console.log('Basic subscription removed successfully');
  }

  console.log('Subscription cancellation processed successfully');

  return createJsonResponse({ 
    success: true,
    message: isCreatorSubscription ? 'Subscription will be cancelled at the end of your current billing period' : 'Subscription cancelled immediately'
  });
}
