
import { createJsonResponse } from '../utils/cors.ts';

export async function handlePaymentIntentWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[PaymentIntentHandler] Processing payment intent webhook:', event.type, event.id);

  const paymentIntent = event.data.object;
  console.log('[PaymentIntentHandler] Payment Intent ID:', paymentIntent.id);
  console.log('[PaymentIntentHandler] Payment Intent status:', paymentIntent.status);
  console.log('[PaymentIntentHandler] Payment Intent metadata:', paymentIntent.metadata);

  // Only process succeeded payment intents for subscription setup
  if (paymentIntent.status !== 'succeeded') {
    console.log('[PaymentIntentHandler] Payment intent not succeeded, skipping');
    return createJsonResponse({ success: true });
  }

  // Check if this is a subscription setup payment OR if it's linked to a subscription
  const isSubscriptionPayment = paymentIntent.metadata.type === 'subscription_setup' || 
                                paymentIntent.invoice || 
                                paymentIntent.description?.includes('subscription');
  
  if (!isSubscriptionPayment) {
    console.log('[PaymentIntentHandler] Not a subscription-related payment, skipping');
    return createJsonResponse({ success: true });
  }

  const { 
    user_id, 
    creator_id, 
    tier_id, 
    tier_name, 
    creator_name,
    is_upgrade,
    existing_subscription_id,
    current_period_end
  } = paymentIntent.metadata;

  if (!user_id || !creator_id || !tier_id) {
    console.error('[PaymentIntentHandler] Missing required metadata in payment intent:', paymentIntent.id);
    return createJsonResponse({ error: 'Missing required metadata' }, 400);
  }

  const isUpgradeFlow = is_upgrade === 'true';
  console.log('[PaymentIntentHandler] Processing subscription:', { 
    user_id, 
    creator_id, 
    tier_id, 
    isUpgradeFlow,
    existing_subscription_id 
  });

  try {
    // Get the payment method used in this payment intent
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
    console.log('[PaymentIntentHandler] Payment method retrieved:', paymentMethod.id);

    // Get tier details for subscription creation/update
    const { data: tier, error: tierError } = await supabaseService
      .from('membership_tiers')
      .select(`
        *,
        creators!inner(
          stripe_account_id,
          display_name
        )
      `)
      .eq('id', tier_id)
      .single();

    if (tierError || !tier) {
      console.error('[PaymentIntentHandler] Tier not found:', tierError);
      return createJsonResponse({ error: 'Tier not found' }, 404);
    }

    if (isUpgradeFlow && existing_subscription_id) {
      // Handle upgrade: Update existing Stripe subscription
      console.log('[PaymentIntentHandler] Processing upgrade - updating existing subscription:', existing_subscription_id);
      
      try {
        // Update the existing subscription to the new tier
        const updatedSubscription = await stripe.subscriptions.update(existing_subscription_id, {
          items: [{
            id: (await stripe.subscriptions.retrieve(existing_subscription_id)).items.data[0].id,
            price: tier.stripe_price_id,
          }],
          default_payment_method: paymentMethod.id,
          proration_behavior: 'none', // We handled proration with the payment intent
          metadata: {
            user_id,
            creator_id,
            tier_id,
            tier_name,
            creator_name
          }
        });

        console.log('[PaymentIntentHandler] Stripe subscription updated:', updatedSubscription.id);

        // Update subscription record in database
        const subscriptionData = {
          tier_id,
          amount: tier.price,
          status: updatedSubscription.status === 'active' ? 'active' : updatedSubscription.status,
          updated_at: new Date().toISOString(),
        };

        console.log('[PaymentIntentHandler] Updating subscription record:', subscriptionData);

        const { error: updateError } = await supabaseService
          .from('user_subscriptions')
          .update(subscriptionData)
          .eq('stripe_subscription_id', existing_subscription_id);

        if (updateError) {
          console.error('[PaymentIntentHandler] Error updating subscription record:', updateError);
          throw updateError;
        }

        console.log('[PaymentIntentHandler] Successfully updated subscription record for upgrade');

      } catch (error) {
        console.error('[PaymentIntentHandler] Error processing upgrade:', error);
        return createJsonResponse({ error: 'Failed to process subscription upgrade' }, 500);
      }

    } else {
      // Handle new subscription: Check if subscription already exists from invoice
      console.log('[PaymentIntentHandler] Processing new subscription');

      // First, check if this payment intent is linked to an existing subscription
      let existingStripeSubscriptionId = null;
      
      if (paymentIntent.invoice) {
        console.log('[PaymentIntentHandler] Payment has invoice, fetching subscription:', paymentIntent.invoice);
        try {
          const invoice = await stripe.invoices.retrieve(paymentIntent.invoice);
          existingStripeSubscriptionId = invoice.subscription;
          console.log('[PaymentIntentHandler] Found subscription from invoice:', existingStripeSubscriptionId);
        } catch (invoiceError) {
          console.error('[PaymentIntentHandler] Error fetching invoice:', invoiceError);
        }
      }

      // Check if subscription record already exists in database
      let existingRecord = null;
      if (existingStripeSubscriptionId) {
        const { data: dbRecord, error: checkError } = await supabaseService
          .from('user_subscriptions')
          .select('*')
          .eq('stripe_subscription_id', existingStripeSubscriptionId)
          .single();
        
        if (!checkError && dbRecord) {
          existingRecord = dbRecord;
          console.log('[PaymentIntentHandler] Found existing database record:', existingRecord.id);
        }
      }

      // If we have an existing record, just update it to active
      if (existingRecord) {
        console.log('[PaymentIntentHandler] Updating existing subscription to active:', existingRecord.id);
        
        const { error: updateError } = await supabaseService
          .from('user_subscriptions')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);

        if (updateError) {
          console.error('[PaymentIntentHandler] Error updating existing subscription:', updateError);
        } else {
          console.log('[PaymentIntentHandler] Successfully updated existing subscription to active');
        }
        
        return createJsonResponse({ success: true });
      }

      // If no existing subscription, we need to create one (this shouldn't happen with proper Stripe checkout)
      console.log('[PaymentIntentHandler] No existing subscription found, this indicates a checkout flow issue');
      
      // Get Stripe subscription by customer and check recent subscriptions
      const recentSubscriptions = await stripe.subscriptions.list({
        customer: paymentIntent.customer,
        limit: 5,
        created: {
          gte: Math.floor(Date.now() / 1000) - 3600, // Last hour
        }
      });
      
      let targetSubscription = null;
      for (const sub of recentSubscriptions.data) {
        if (sub.metadata.user_id === user_id && 
            sub.metadata.creator_id === creator_id && 
            sub.metadata.tier_id === tier_id) {
          targetSubscription = sub;
          console.log('[PaymentIntentHandler] Found matching recent subscription:', sub.id);
          break;
        }
      }

      if (!targetSubscription) {
        console.error('[PaymentIntentHandler] No matching subscription found in Stripe for this payment');
        return createJsonResponse({ error: 'No matching subscription found' }, 400);
      }

      // Create subscription record in database using the found subscription
      const subscriptionData = {
        user_id,
        creator_id,
        tier_id,
        stripe_subscription_id: targetSubscription.id,
        stripe_customer_id: targetSubscription.customer,
        status: 'active', // Set to active since payment already succeeded
        amount: tier.price,
        current_period_start: targetSubscription.current_period_start ? 
          new Date(targetSubscription.current_period_start * 1000).toISOString() : null,
        current_period_end: targetSubscription.current_period_end ? 
          new Date(targetSubscription.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: targetSubscription.cancel_at_period_end || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('[PaymentIntentHandler] ===== SUBSCRIPTION DATA TO INSERT =====');
      console.log('[PaymentIntentHandler] user_id:', user_id);
      console.log('[PaymentIntentHandler] creator_id:', creator_id);
      console.log('[PaymentIntentHandler] tier_id:', tier_id);
      console.log('[PaymentIntentHandler] stripe_subscription_id:', targetSubscription.id);
      console.log('[PaymentIntentHandler] amount:', tier.price);
      console.log('[PaymentIntentHandler] Stripe subscription status:', targetSubscription.status);
      console.log('[PaymentIntentHandler] Setting status to: active (overriding Stripe status since payment succeeded)');
      console.log('[PaymentIntentHandler] Full subscription data:', JSON.stringify(subscriptionData, null, 2));

      const { data: insertedData, error: insertError } = await supabaseService
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select('*')
        .single();

      if (insertError) {
        console.error('[PaymentIntentHandler] ===== DATABASE INSERT ERROR =====');
        console.error('[PaymentIntentHandler] Error details:', JSON.stringify(insertError, null, 2));
        console.error('[PaymentIntentHandler] Error code:', insertError.code);
        console.error('[PaymentIntentHandler] Error message:', insertError.message);
        console.error('[PaymentIntentHandler] Error hint:', insertError.hint);
        
        // Log the error but don't cancel the subscription since it already exists in Stripe
        console.error('[PaymentIntentHandler] Could not create database record for existing subscription:', targetSubscription.id);
        throw insertError;
      }

      console.log('[PaymentIntentHandler] ===== SUBSCRIPTION SUCCESSFULLY CREATED =====');
      console.log('[PaymentIntentHandler] Inserted subscription record:', JSON.stringify(insertedData, null, 2));
      console.log('[PaymentIntentHandler] Subscription ID in DB:', insertedData?.id);
      
      // Verify the record was actually inserted by querying it back
      const { data: verifyData, error: verifyError } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', targetSubscription.id)
        .single();
        
      if (verifyError) {
        console.error('[PaymentIntentHandler] ===== VERIFICATION ERROR =====');
        console.error('[PaymentIntentHandler] Could not verify inserted record:', verifyError);
      } else {
        console.log('[PaymentIntentHandler] ===== VERIFICATION SUCCESS =====');
        console.log('[PaymentIntentHandler] Verified subscription exists:', JSON.stringify(verifyData, null, 2));
      }
    }

    // Clean up legacy subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id);

    console.log('[PaymentIntentHandler] Payment intent webhook processing complete');
    return createJsonResponse({ success: true });

  } catch (error) {
    console.error('[PaymentIntentHandler] Error processing payment intent webhook:', error);
    return createJsonResponse({ error: 'Failed to process payment intent webhook' }, 500);
  }
}
