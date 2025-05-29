
import { createJsonResponse } from '../utils/cors.ts';

export async function handleReactivateSubscription(
  stripe: any,
  supabaseService: any,
  user: any,
  subscriptionId: string
) {
  console.log('Reactivating subscription:', subscriptionId);

  if (!subscriptionId) {
    console.log('ERROR: Missing subscriptionId');
    return createJsonResponse({ error: 'Missing subscription ID' }, 400);
  }

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

  console.log('Found user subscription to reactivate:', userSubscription.id);

  // Reactivate subscription in Stripe by removing cancel_at_period_end
  try {
    console.log('Removing cancel_at_period_end from Stripe subscription:', subscriptionId);
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
    console.log('Stripe subscription reactivated successfully');
    
    // Update database to reflect active status
    const { error: updateError } = await supabaseService
      .from('user_subscriptions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userSubscription.id);

    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
      return createJsonResponse({ error: 'Failed to update subscription status' }, 500);
    }

    console.log('User subscription updated to active status successfully');

    return createJsonResponse({ 
      success: true,
      message: 'Subscription has been reactivated successfully',
      subscription: {
        id: updatedSubscription.id,
        status: 'active',
        cancel_at_period_end: false
      }
    });

  } catch (stripeError) {
    console.error('Error reactivating Stripe subscription:', stripeError);
    return createJsonResponse({ error: 'Failed to reactivate subscription' }, 500);
  }
}
