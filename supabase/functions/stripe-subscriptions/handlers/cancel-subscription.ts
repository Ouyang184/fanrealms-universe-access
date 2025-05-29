
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

    // Get all active subscriptions for this user from user_subscriptions table
    const { data: userSubs, error: userSubError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (userSubError) {
      console.error('Error querying user subscriptions:', userSubError);
    }

    console.log('Found subscriptions to cancel:', {
      userSubs: userSubs?.length || 0
    });

    // Cancel all user subscriptions
    if (userSubs && userSubs.length > 0) {
      for (const subscription of userSubs) {
        if (subscription.stripe_subscription_id) {
          try {
            console.log('Setting Stripe subscription to cancel at period end:', subscription.stripe_subscription_id);
            await stripe.subscriptions.update(subscription.stripe_subscription_id, {
              cancel_at_period_end: true
            });
            console.log('Stripe subscription set to cancel at period end successfully');
          } catch (stripeError) {
            console.error('Error setting Stripe subscription to cancel:', stripeError);
          }
        }

        // Update database to cancelling status
        console.log('Updating user subscription to cancelling status:', subscription.id);
        const { error: updateError } = await supabaseService
          .from('user_subscriptions')
          .update({ 
            status: 'cancelling',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error('Error updating user subscription status:', updateError);
        }
      }
    }

    // Clean up any legacy basic subscriptions
    const { error: basicDeleteError } = await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (basicDeleteError) {
      console.error('Error deleting basic subscriptions:', basicDeleteError);
    }

    console.log('All subscriptions set to cancel at period end successfully');

    return createJsonResponse({ 
      success: true,
      message: 'All active subscriptions have been set to cancel at the end of their billing periods'
    });
  }

  // Handle single subscription cancellation by stripe_subscription_id
  console.log('Cancelling single subscription by stripe_subscription_id:', subscriptionId);

  // Find the subscription in user_subscriptions table by stripe_subscription_id
  const { data: userSubscription, error: userSubError } = await supabaseService
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (userSubError) {
    console.error('Error querying user_subscriptions:', userSubError);
    return createJsonResponse({ error: 'Failed to find subscription' }, 500);
  }

  if (!userSubscription) {
    console.error('Subscription not found');
    return createJsonResponse({ error: 'Subscription not found' }, 404);
  }

  console.log('Found user subscription to cancel:', userSubscription.id);

  // Set subscription to cancel at period end in Stripe
  try {
    console.log('Setting Stripe subscription to cancel at period end:', subscriptionId);
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    console.log('Stripe subscription set to cancel at period end successfully');
    
    // Update database to reflect cancelling status
    const { error: updateError } = await supabaseService
      .from('user_subscriptions')
      .update({ 
        status: 'cancelling',
        updated_at: new Date().toISOString()
      })
      .eq('id', userSubscription.id);

    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
      return createJsonResponse({ error: 'Failed to update subscription status' }, 500);
    }

    console.log('User subscription updated to cancelling status successfully');

    // Clean up any corresponding basic subscription
    if (userSubscription.creator_id && userSubscription.tier_id) {
      await supabaseService
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('creator_id', userSubscription.creator_id)
        .eq('tier_id', userSubscription.tier_id);
      
      console.log('Cleaned up corresponding basic subscription');
    }

    return createJsonResponse({ 
      success: true,
      message: 'Subscription has been set to cancel at the end of the billing period',
      cancelAt: updatedSubscription.cancel_at ? new Date(updatedSubscription.cancel_at * 1000).toISOString() : null
    });

  } catch (stripeError) {
    console.error('Error setting Stripe subscription to cancel:', stripeError);
    return createJsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }
}
