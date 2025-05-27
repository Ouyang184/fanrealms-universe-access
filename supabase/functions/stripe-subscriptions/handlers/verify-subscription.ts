
import { createJsonResponse } from '../utils/cors.ts';

export async function handleVerifySubscription(
  stripe: any,
  supabaseService: any,
  subscriptionId: string
) {
  console.log('Verifying subscription:', subscriptionId);

  try {
    // Get subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Consider a subscription active if it's active OR if it's incomplete but recently created (within 1 hour)
    const isActive = subscription.status === 'active';
    const isIncompleteButRecent = subscription.status === 'incomplete' && 
      (Date.now() - (subscription.created * 1000)) < 3600000; // 1 hour
    
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
    
    console.log('Stripe subscription status:', {
      id: subscriptionId,
      status: subscription.status,
      isActive,
      isIncompleteButRecent,
      cancelAtPeriodEnd,
      created: new Date(subscription.created * 1000).toISOString()
    });

    // Return true for active subscriptions or recent incomplete ones (pending payment)
    const shouldBeActive = (isActive || isIncompleteButRecent) && !cancelAtPeriodEnd;

    return createJsonResponse({
      isActive: shouldBeActive,
      status: subscription.status,
      cancelAtPeriodEnd,
      currentPeriodEnd: subscription.current_period_end,
      isPendingPayment: isIncompleteButRecent
    });

  } catch (error) {
    console.error('Error verifying subscription:', error);
    
    if (error.code === 'resource_missing') {
      return createJsonResponse({
        isActive: false,
        status: 'not_found',
        cancelAtPeriodEnd: false
      });
    }
    
    return createJsonResponse({ error: 'Failed to verify subscription' }, 500);
  }
}
