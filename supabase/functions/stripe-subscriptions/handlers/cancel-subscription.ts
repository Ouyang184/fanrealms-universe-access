
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
    .select('stripe_subscription_id, id, user_id, creator_id, status')
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
    
    // Debug: Let's see what subscriptions this user has
    const { data: allUserSubs } = await supabaseService
      .from('creator_subscriptions')
      .select('id, status, stripe_subscription_id')
      .eq('user_id', user.id);
    console.log('All user creator_subscriptions:', allUserSubs);

    const { data: allBasicSubs } = await supabaseService
      .from('subscriptions')
      .select('id, creator_id, tier_id, is_paid')
      .eq('user_id', user.id);
    console.log('All user subscriptions:', allBasicSubs);
    
    return createJsonResponse({ error: 'Subscription not found or already cancelled' }, 404);
  }

  console.log('Found subscription:', subscriptionData);

  // Cancel Stripe subscription if we have a stripe_subscription_id (only for creator_subscriptions)
  if (isCreatorSubscription && subscriptionData.stripe_subscription_id) {
    try {
      console.log('Cancelling Stripe subscription:', subscriptionData.stripe_subscription_id);
      await stripe.subscriptions.cancel(subscriptionData.stripe_subscription_id);
      console.log('Stripe subscription cancelled successfully');
    } catch (stripeError) {
      console.error('Error cancelling Stripe subscription:', stripeError);
      return createJsonResponse({ error: 'Failed to cancel subscription' }, 500);
    }

    // Update creator_subscriptions table
    const { error: updateError } = await supabaseService
      .from('creator_subscriptions')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Error updating creator_subscriptions status:', updateError);
      return createJsonResponse({ error: 'Failed to update subscription status' }, 500);
    }
  }

  // Remove/update subscription in basic subscriptions table
  if (isCreatorSubscription) {
    // Remove from subscriptions table if it exists there too
    const { error: deleteError } = await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', subscriptionData.user_id)
      .eq('creator_id', subscriptionData.creator_id);

    if (deleteError) {
      console.error('Error removing subscription from subscriptions table:', deleteError);
    }
  } else {
    // Just remove from subscriptions table
    const { error: deleteError } = await supabaseService
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId);

    if (deleteError) {
      console.error('Error removing subscription from subscriptions table:', deleteError);
      return createJsonResponse({ error: 'Failed to remove subscription' }, 500);
    }
  }

  console.log('Subscription cancelled successfully');

  return createJsonResponse({ success: true });
}
