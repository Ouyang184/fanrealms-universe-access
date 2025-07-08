import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleReactivateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('[ReactivateSubscription] === STARTING SUBSCRIPTION REACTIVATION ===');
  console.log('[ReactivateSubscription] User ID:', user.id);
  console.log('[ReactivateSubscription] Request body:', JSON.stringify(body, null, 2));

  const { subscriptionId } = body;

  if (!subscriptionId) {
    return createJsonResponse({ error: 'Subscription ID is required' }, 400);
  }

  // Create service client for database operations
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('[ReactivateSubscription] Reactivating Stripe subscription:', subscriptionId);

    // Reactivate the subscription in Stripe by removing the cancellation
    const reactivatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
      cancel_at: null
    });

    console.log('[ReactivateSubscription] Stripe subscription reactivated:', reactivatedSubscription.id);

    // Update the database record
    await supabaseService
      .from('user_subscriptions')
      .update({
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    console.log('[ReactivateSubscription] Database updated successfully');

    return createJsonResponse({
      success: true,
      reactivated: true,
      current_period_end: reactivatedSubscription.current_period_end
    });

  } catch (error) {
    console.error('[ReactivateSubscription] Error:', error);
    return createJsonResponse({ 
      error: 'Failed to reactivate subscription. Please try again later.' 
    }, 500);
  }
}