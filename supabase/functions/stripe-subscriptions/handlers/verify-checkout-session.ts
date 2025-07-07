
import { createJsonResponse } from '../utils/cors.ts';

export async function handleVerifyCheckoutSession(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('Verifying checkout session for user:', user.id);
  
  const { sessionId } = body;
  
  if (!sessionId) {
    return createJsonResponse({ error: 'Missing session ID' }, 400);
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Retrieved session:', session.id, 'Status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      return createJsonResponse({ 
        success: false, 
        error: 'Payment not completed' 
      }, 200);
    }

    // Get subscription details if available
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      console.log('Retrieved subscription:', subscription.id, 'Status:', subscription.status);
      
      const metadata = session.metadata || subscription.metadata || {};
      
      return createJsonResponse({
        success: true,
        sessionId: session.id,
        subscriptionId: subscription.id,
        tierName: metadata.tier_name || 'subscription',
        isUpgrade: metadata.is_upgrade === 'true'
      });
    }

    return createJsonResponse({
      success: true,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return createJsonResponse({ 
      error: 'Failed to verify checkout session' 
    }, 500);
  }
}
