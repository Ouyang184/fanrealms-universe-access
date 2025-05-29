
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

    // Extract metadata from session - this is the key fix
    const metadata = session.metadata || {};
    const { user_id, creator_id, tier_id } = metadata;
    
    console.log('[CheckoutHandler] Extracted metadata from session:', { user_id, creator_id, tier_id });

    if (!user_id || !creator_id || !tier_id) {
      console.error('[CheckoutHandler] Missing required metadata. Session:', session.id);
      console.error('[CheckoutHandler] Available metadata:', metadata);
      
      // Try to extract from client_reference_id if available
      if (session.client_reference_id) {
        try {
          const referenceData = JSON.parse(session.client_reference_id);
          console.log('[CheckoutHandler] Trying client_reference_id:', referenceData);
          if (referenceData.user_id && referenceData.creator_id && referenceData.tier_id) {
            await processSubscription(session, referenceData, supabaseService, stripe);
            return;
          }
        } catch (e) {
          console.error('[CheckoutHandler] Failed to parse client_reference_id:', e);
        }
      }
      
      // If still no metadata, we can't process this webhook
      console.error('[CheckoutHandler] Cannot process subscription without metadata');
      return;
    }

    await processSubscription(session, { user_id, creator_id, tier_id }, supabaseService, stripe);
  }

  console.log('[CheckoutHandler] Checkout webhook processing complete');
}

async function processSubscription(session: any, metadata: any, supabaseService: any, stripe: any) {
  const { user_id, creator_id, tier_id } = metadata;
  
  console.log('[CheckoutHandler] Processing subscription with metadata:', { user_id, creator_id, tier_id });
  
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

      // Map Stripe status to our valid statuses
      let dbStatus = 'pending';
      if (subscription.status === 'active') {
        dbStatus = subscription.cancel_at_period_end ? 'cancelling' : 'active';
      } else if (subscription.status === 'trialing') {
        dbStatus = 'active'; // Treat trialing as active
      }

      const subscriptionData = {
        user_id,
        creator_id, // CRITICAL: Ensure creator_id is included from session metadata
        tier_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: session.customer,
        status: dbStatus,
        amount,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      };

      console.log('[CheckoutHandler] CRITICAL: About to insert/update user_subscriptions with creator_id');
      console.log('[CheckoutHandler] Insert data with creator_id:', subscriptionData);

      // First check if record already exists to avoid duplicates
      const { data: existingRecord } = await supabaseService
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user_id)
        .eq('creator_id', creator_id)
        .eq('tier_id', tier_id)
        .maybeSingle();

      if (existingRecord) {
        console.log('[CheckoutHandler] Updating existing subscription record with creator_id');
        // Update existing record
        const { data, error } = await supabaseService
          .from('user_subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer,
            status: dbStatus,
            amount,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)
          .eq('creator_id', creator_id)
          .eq('tier_id', tier_id)
          .select();

        if (error) {
          console.error('[CheckoutHandler] ERROR updating user_subscriptions:', error);
          throw error;
        } else {
          console.log('[CheckoutHandler] SUCCESS: Updated subscription in user_subscriptions with creator_id:', data);
        }
      } else {
        console.log('[CheckoutHandler] Creating new subscription record with creator_id');
        // Insert new record
        const { data, error } = await supabaseService
          .from('user_subscriptions')
          .insert({
            ...subscriptionData,
            created_at: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.error('[CheckoutHandler] ERROR inserting into user_subscriptions:', error);
          throw error;
        } else {
          console.log('[CheckoutHandler] SUCCESS: Inserted subscription into user_subscriptions with creator_id:', data);
        }
      }

    } catch (stripeError) {
      console.error('[CheckoutHandler] Error retrieving subscription from Stripe:', stripeError);
      throw stripeError;
    }
  } else {
    console.log('[CheckoutHandler] No subscription found in session, skipping subscription creation');
  }
}
