
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
    
    const isActive = subscription.status === 'active';
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
    
    console.log('Stripe subscription status:', {
      id: subscriptionId,
      status: subscription.status,
      isActive,
      cancelAtPeriodEnd
    });

    return createJsonResponse({
      isActive: isActive && !cancelAtPeriodEnd,
      status: subscription.status,
      cancelAtPeriodEnd,
      currentPeriodEnd: subscription.current_period_end
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
