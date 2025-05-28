
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleCheckoutWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[CheckoutHandler] Processing checkout webhook:', event.type, event.id);

  const session = event.data.object;
  console.log('[CheckoutHandler] Session data:', {
    id: session.id,
    customer: session.customer,
    subscription: session.subscription,
    metadata: session.metadata
  });

  if (event.type === 'checkout.session.completed') {
    console.log('[CheckoutHandler] Processing checkout session completed:', session.id);

    // Extract metadata
    const { user_id, creator_id, tier_id } = session.metadata || {};
    
    if (!user_id || !creator_id || !tier_id) {
      console.error('[CheckoutHandler] Missing required metadata:', session.metadata);
      return;
    }

    console.log('[CheckoutHandler] Extracted metadata:', { user_id, creator_id, tier_id });

    if (session.subscription) {
      console.log('[CheckoutHandler] Retrieving subscription details from Stripe:', session.subscription);
      
      try {
        // Retrieve full subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        console.log('[CheckoutHandler] Retrieved subscription:', {
          id: subscription.id,
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end
        });

        const currentPeriodStart = subscription.current_period_start ? 
          new Date(subscription.current_period_start * 1000).toISOString() : null;
        const currentPeriodEnd = subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : null;

        // Calculate amount from the subscription
        const amount = subscription.items?.data?.[0]?.price?.unit_amount ? 
          subscription.items.data[0].price.unit_amount / 100 : 0;

        console.log('[CheckoutHandler] BEFORE inserting into user_subscriptions');
        console.log('[CheckoutHandler] Insert data:', {
          user_id,
          creator_id,
          tier_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer,
          status: subscription.status === 'active' ? 'active' : 'pending',
          amount,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd
        });

        // Insert into user_subscriptions table
        const { data, error } = await supabaseService
          .from('user_subscriptions')
          .insert({
            user_id,
            creator_id,
            tier_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer,
            status: subscription.status === 'active' ? 'active' : 'pending',
            amount,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('[CheckoutHandler] ERROR inserting into user_subscriptions:', error);
          throw error;
        } else {
          console.log('[CheckoutHandler] SUCCESS: Inserted subscription into user_subscriptions:', data);
        }

      } catch (stripeError) {
        console.error('[CheckoutHandler] Error retrieving subscription from Stripe:', stripeError);
        throw stripeError;
      }
    } else {
      console.log('[CheckoutHandler] No subscription found in session, skipping subscription creation');
    }
  }

  console.log('[CheckoutHandler] Checkout webhook processing complete');
}
