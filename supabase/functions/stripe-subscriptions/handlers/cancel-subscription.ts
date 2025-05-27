
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

  // Find subscription in creator_subscriptions table using the internal ID
  console.log('Looking for subscription in creator_subscriptions table...');
  const { data: creatorSubscription, error: creatorSubError } = await supabaseService
    .from('creator_subscriptions')
    .select('stripe_subscription_id, id, user_id, creator_id, status')
    .eq('user_id', user.id)
    .eq('id', subscriptionId)
    .maybeSingle();

  if (creatorSubError) {
    console.error('Error finding creator subscription:', creatorSubError);
    return createJsonResponse({ error: 'Failed to find subscription' }, 500);
  }

  if (!creatorSubscription) {
    console.log('ERROR: Subscription not found for user:', user.id, 'subscription ID:', subscriptionId);
    // Let's also try to find any subscription for this user to debug
    const { data: allUserSubs } = await supabaseService
      .from('creator_subscriptions')
      .select('id, status, stripe_subscription_id')
      .eq('user_id', user.id);
    console.log('All user subscriptions:', allUserSubs);
    
    return createJsonResponse({ error: 'Subscription not found or already cancelled' }, 404);
  }

  console.log('Found subscription:', creatorSubscription);

  // Cancel Stripe subscription if we have a stripe_subscription_id
  if (creatorSubscription.stripe_subscription_id) {
    try {
      console.log('Cancelling Stripe subscription:', creatorSubscription.stripe_subscription_id);
      await stripe.subscriptions.cancel(creatorSubscription.stripe_subscription_id);
      console.log('Stripe subscription cancelled successfully');
    } catch (stripeError) {
      console.error('Error cancelling Stripe subscription:', stripeError);
      return createJsonResponse({ error: 'Failed to cancel subscription' }, 500);
    }
  }

  // Update database to mark subscription as cancelled
  const { error: updateError } = await supabaseService
    .from('creator_subscriptions')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);

  if (updateError) {
    console.error('Error updating subscription status in database:', updateError);
    return createJsonResponse({ error: 'Failed to update subscription status' }, 500);
  }

  // Also remove from subscriptions table
  const { error: deleteError } = await supabaseService
    .from('subscriptions')
    .delete()
    .eq('user_id', creatorSubscription.user_id)
    .eq('creator_id', creatorSubscription.creator_id);

  if (deleteError) {
    console.error('Error removing subscription from subscriptions table:', deleteError);
  }

  console.log('Subscription cancelled successfully');

  return createJsonResponse({ success: true });
}
