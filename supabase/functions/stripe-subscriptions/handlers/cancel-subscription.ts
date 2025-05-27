
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

    // Get all subscriptions for this user across both tables
    const { data: creatorSubs, error: creatorSubError } = await supabaseService
      .from('creator_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    const { data: basicSubs, error: basicSubError } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (creatorSubError) {
      console.error('Error querying creator subscriptions:', creatorSubError);
    }

    if (basicSubError) {
      console.error('Error querying basic subscriptions:', basicSubError);
    }

    console.log('Found subscriptions to cancel:', {
      creatorSubs: creatorSubs?.length || 0,
      basicSubs: basicSubs?.length || 0
    });

    // Cancel all creator subscriptions
    if (creatorSubs && creatorSubs.length > 0) {
      for (const subscription of creatorSubs) {
        if (subscription.stripe_subscription_id) {
          try {
            console.log('Cancelling Stripe subscription:', subscription.stripe_subscription_id);
            await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
            console.log('Stripe subscription cancelled successfully');
          } catch (stripeError) {
            console.error('Error cancelling Stripe subscription:', stripeError);
          }
        }

        // Remove from database
        console.log('Removing creator subscription from database:', subscription.id);
        const { error: deleteError } = await supabaseService
          .from('creator_subscriptions')
          .delete()
          .eq('id', subscription.id);

        if (deleteError) {
          console.error('Error deleting creator subscription:', deleteError);
        }
      }
    }

    // Clean up all basic subscriptions
    if (basicSubs && basicSubs.length > 0) {
      console.log('Cleaning up basic subscriptions...');
      const { error: basicDeleteError } = await supabaseService
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (basicDeleteError) {
        console.error('Error deleting basic subscriptions:', basicDeleteError);
      }
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
  const { data: creatorSubscription, error: creatorSubError } = await supabaseService
    .from('creator_subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (creatorSubError) {
    console.error('Error querying creator_subscriptions:', creatorSubError);
  }

  let cancelled = false;

  if (creatorSubscription) {
    console.log('Found creator subscription to cancel:', creatorSubscription.id);

    // Cancel in Stripe if we have a stripe_subscription_id
    if (creatorSubscription.stripe_subscription_id) {
      try {
        console.log('Cancelling Stripe subscription:', creatorSubscription.stripe_subscription_id);
        await stripe.subscriptions.cancel(creatorSubscription.stripe_subscription_id);
        console.log('Stripe subscription cancelled successfully');
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        // Continue with database cleanup even if Stripe fails
      }
    }

    // Remove from creator_subscriptions table
    const { error: deleteError } = await supabaseService
      .from('creator_subscriptions')
      .delete()
      .eq('id', subscriptionId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting creator subscription:', deleteError);
      return createJsonResponse({ error: 'Failed to cancel subscription' }, 500);
    }

    console.log('Creator subscription cancelled and removed successfully');
    cancelled = true;

    // Also clean up any corresponding basic subscription
    if (creatorSubscription.creator_id && creatorSubscription.tier_id) {
      await supabaseService
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('creator_id', creatorSubscription.creator_id)
        .eq('tier_id', creatorSubscription.tier_id);
      
      console.log('Cleaned up corresponding basic subscription');
    }
  }

  // If not found in creator_subscriptions, try basic subscriptions table
  if (!cancelled) {
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
  }

  return createJsonResponse({ 
    success: true,
    message: 'Subscription has been cancelled and removed'
  });
}
