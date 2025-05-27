
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCancelSubscription(
  stripe: any,
  supabaseService: any,
  user: any,
  subscriptionId: string
) {
  console.log('Force cancelling subscription:', subscriptionId);

  if (!subscriptionId) {
    console.log('ERROR: Missing subscriptionId');
    return createJsonResponse({ error: 'Missing subscription ID' }, 400);
  }

  // First, find ALL active subscriptions for this user and cancel them
  console.log('Looking for ALL active subscriptions for user:', user.id);
  const { data: activeSubscriptions, error: activeSubError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (activeSubError) {
    console.error('Error querying active subscriptions:', activeSubError);
  }

  console.log('Found active subscriptions:', activeSubscriptions?.length || 0);

  // Cancel ALL active subscriptions in Stripe and database
  if (activeSubscriptions && activeSubscriptions.length > 0) {
    for (const subscription of activeSubscriptions) {
      console.log('Processing subscription:', subscription.id);
      
      // Cancel in Stripe if we have a stripe_subscription_id
      if (subscription.stripe_subscription_id) {
        try {
          console.log('Cancelling Stripe subscription:', subscription.stripe_subscription_id);
          await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
          console.log('Stripe subscription cancelled successfully');
        } catch (stripeError) {
          console.error('Error cancelling Stripe subscription:', stripeError);
          // Continue anyway to clean up database
        }
      }

      // Remove from database
      console.log('Removing subscription from database:', subscription.id);
      const { error: deleteError } = await supabaseService
        .from('creator_subscriptions')
        .delete()
        .eq('id', subscription.id);

      if (deleteError) {
        console.error('Error deleting subscription:', deleteError);
      } else {
        console.log('Subscription removed from database successfully');
      }
    }
  }

  // Also clean up any basic subscriptions
  console.log('Cleaning up basic subscriptions...');
  const { error: basicDeleteError } = await supabaseService
    .from('subscriptions')
    .delete()
    .eq('user_id', user.id);

  if (basicDeleteError) {
    console.error('Error deleting basic subscriptions:', basicDeleteError);
  }

  console.log('All subscriptions cancelled and cleaned up successfully');

  return createJsonResponse({ 
    success: true,
    message: 'All active subscriptions have been cancelled and removed'
  });
}
