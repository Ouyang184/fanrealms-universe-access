
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

  // Check if this is a subscription setup payment
  if (paymentIntent.metadata.type !== 'subscription_setup') {
    console.log('[PaymentIntentHandler] Not a subscription setup payment, skipping');
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
      // Handle new subscription: Create new Stripe subscription
      console.log('[PaymentIntentHandler] Processing new subscription');

      // Use existing Stripe price ID or create one if it doesn't exist
      let stripePriceId = tier.stripe_price_id;
      
      if (!stripePriceId) {
        console.log('[PaymentIntentHandler] Creating new Stripe price for tier:', tier.title);
        
        try {
          const price = await stripe.prices.create({
            unit_amount: Math.round(tier.price * 100),
            currency: 'usd',
            recurring: { interval: 'month' },
            product_data: { 
              name: tier.title,
              metadata: {
                tier_id: tier_id,
                creator_id: creator_id
              }
            }
          });
          stripePriceId = price.id;
          console.log('[PaymentIntentHandler] Created new price:', stripePriceId);

          // Update tier with the new stripe_price_id
          await supabaseService
            .from('membership_tiers')
            .update({ 
              stripe_price_id: stripePriceId,
              stripe_product_id: price.product 
            })
            .eq('id', tier_id);
            
          console.log('[PaymentIntentHandler] Updated tier with new price and product IDs');
        } catch (priceError) {
          console.error('[PaymentIntentHandler] Error creating price:', priceError);
          throw new Error('Failed to create Stripe price');
        }
      }

      // Create the subscription in Stripe
      const subscription = await stripe.subscriptions.create({
        customer: paymentIntent.customer,
        items: [{ price: stripePriceId }],
        default_payment_method: paymentMethod.id,
        application_fee_percent: 5,
        transfer_data: { destination: tier.creators.stripe_account_id },
        metadata: {
          user_id,
          creator_id,
          tier_id,
          tier_name,
          creator_name
        }
      });

      console.log('[PaymentIntentHandler] Stripe subscription created:', subscription.id);

      // Create subscription record in database
      const subscriptionData = {
        user_id,
        creator_id,
        tier_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status === 'active' ? 'active' : subscription.status,
        amount: tier.price,
        current_period_start: subscription.current_period_start ? 
          new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? 
          new Date(subscription.current_period_end * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('[PaymentIntentHandler] ===== SUBSCRIPTION DATA TO INSERT =====');
      console.log('[PaymentIntentHandler] user_id:', user_id);
      console.log('[PaymentIntentHandler] creator_id:', creator_id);
      console.log('[PaymentIntentHandler] tier_id:', tier_id);
      console.log('[PaymentIntentHandler] stripe_subscription_id:', subscription.id);
      console.log('[PaymentIntentHandler] amount:', tier.price);
      console.log('[PaymentIntentHandler] status:', subscription.status);
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
        
        // If we can't create the record, cancel the Stripe subscription
        try {
          await stripe.subscriptions.cancel(subscription.id);
          console.log('[PaymentIntentHandler] Cancelled Stripe subscription due to database error');
        } catch (cancelError) {
          console.error('[PaymentIntentHandler] Error cancelling subscription:', cancelError);
        }
        throw insertError;
      }

      console.log('[PaymentIntentHandler] ===== SUBSCRIPTION SUCCESSFULLY CREATED =====');
      console.log('[PaymentIntentHandler] Inserted subscription record:', JSON.stringify(insertedData, null, 2));
      console.log('[PaymentIntentHandler] Subscription ID in DB:', insertedData?.id);
      
      // Verify the record was actually inserted by querying it back
      const { data: verifyData, error: verifyError } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscription.id)
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
