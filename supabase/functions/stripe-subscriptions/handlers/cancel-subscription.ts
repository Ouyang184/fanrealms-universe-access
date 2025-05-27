
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

  // Handle force cancel all case
  if (subscriptionId === 'force_cancel_all') {
    console.log('Force cancelling all subscriptions for user:', user.id);

    // First, find ALL active subscriptions for this user and cancel them
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

        // Remove from database completely
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

  // Handle single subscription cancellation
  console.log('Cancelling single subscription:', subscriptionId);

  // First try to find the subscription in creator_subscriptions table
  const { data: stripeSubscription, error: stripeSubError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (stripeSubError) {
    console.error('Error querying creator_subscriptions:', stripeSubError);
  }

  if (stripeSubscription) {
    console.log('Found Stripe subscription to cancel:', stripeSubscription.id);

    // Cancel in Stripe
    if (stripeSubscription.stripe_subscription_id) {
      try {
        console.log('Cancelling Stripe subscription:', stripeSubscription.stripe_subscription_id);
        await stripe.subscriptions.cancel(stripeSubscription.stripe_subscription_id);
        console.log('Stripe subscription cancelled successfully');
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        // Continue with database cleanup even if Stripe fails
      }
    }

    // Remove from creator_subscriptions table completely
    const { error: deleteError } = await supabaseService
      .from('creator_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting creator subscription:', deleteError);
      return createJsonResponse({ error: 'Failed to cancel subscription' }, 500);
    }

    console.log('Stripe subscription cancelled and removed successfully');

    return createJsonResponse({ 
      success: true,
      message: 'Subscription has been cancelled and removed'
    });
  }

  // If not found in creator_subscriptions, try basic subscriptions table
  console.log('Not found in creator_subscriptions, checking basic subscriptions...');
  const { data: basicSubscription, error: basicSubError } = await supabaseService
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (basicSubError) {
    console.error('Error querying basic subscriptions:', basicSubError);
    return createJsonResponse({ error: 'Failed to find subscription' }, 500);
  }

  if (!basicSubscription) {
    console.error('Subscription not found in either table');
    return createJsonResponse({ error: 'Subscription not found' }, 404);
  }

  console.log('Found basic subscription to cancel:', basicSubscription.id);

  // Remove from basic subscriptions table
  const { error: deleteBasicError } = await supabaseService
    .from('subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('user_id', user.id);

  if (deleteBasicError) {
    console.error('Error deleting basic subscription:', deleteBasicError);
    return createJsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  console.log('Basic subscription cancelled and removed successfully');

  return createJsonResponse({ 
    success: true,
    message: 'Subscription has been cancelled and removed'
  });
}
