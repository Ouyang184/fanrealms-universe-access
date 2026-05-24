
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCheckoutWebhook(
  event: any,
  supabaseService: any,
  stripe: any
) {
  console.log('[CheckoutHandler] Processing checkout session completed:', event.id);

  const session = event.data.object;
  console.log('[CheckoutHandler] Session mode:', session.mode, '| has subscription:', !!session.subscription);

  if (!session.subscription) {
    // One-time marketplace purchase
    const { product_id, buyer_id, creator_id } = session.metadata ?? {};

    if (!product_id || !buyer_id || !creator_id) {
      console.log('[CheckoutHandler] Missing metadata for one-time purchase, skipping');
      return createJsonResponse({ success: true });
    }

    // Fetch product price AND creator fee rate together
    const { data: product, error: productFetchError } = await supabaseService
      .from('digital_products')
      .select('price, creator_id')
      .eq('id', product_id)
      .maybeSingle();

    if (productFetchError) {
      console.error('[CheckoutHandler] Error fetching product:', productFetchError);
      throw productFetchError;
    }

    const { data: creatorRow } = await supabaseService
      .from('creators')
      .select('platform_fee_rate')
      .eq('id', creator_id)
      .maybeSingle();

    const feeRate = creatorRow?.platform_fee_rate ?? 5;
    const amount = Number(product?.price ?? 0);
    const platformFee = parseFloat((amount * feeRate / 100).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));

    // Insert purchase and capture its id
    const { data: insertedPurchase, error: insertError } = await supabaseService
      .from('purchases')
      .insert({
        buyer_id,
        product_id,
        creator_id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent ?? null,
        status: 'completed',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[CheckoutHandler] Error inserting purchase:', insertError);
      throw insertError;
    }

    console.log('[CheckoutHandler] Purchase recorded:', insertedPurchase.id);

    // Check if creator has Stripe Connect with charges enabled
    const { data: stripeAcct } = await supabaseService
      .from('creator_stripe_accounts')
      .select('stripe_charges_enabled')
      .eq('creator_id', creator_id)
      .maybeSingle();

    const hasConnect = !!stripeAcct?.stripe_charges_enabled;

    // Record creator earnings
    const { error: earningsError } = await supabaseService
      .from('creator_earnings')
      .insert({
        creator_id,
        purchase_id: insertedPurchase.id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        earning_type: 'marketplace',
        status: hasConnect ? 'transferred' : 'pending',
      });

    if (earningsError) {
      // Non-fatal: purchase is recorded, log and continue
      console.error('[CheckoutHandler] Error recording creator earnings:', earningsError);
    }

    console.log('[CheckoutHandler] Purchase and earnings recorded. Connect:', hasConnect);
    return createJsonResponse({ success: true });
  }

  try {
    // Get the subscription from Stripe to access metadata
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    console.log('[CheckoutHandler] Retrieved subscription:', subscription.id);

    const { user_id, creator_id, tier_id, existing_subscription_id, action } = subscription.metadata;

    if (!user_id || !creator_id || !tier_id) {
      console.error('[CheckoutHandler] Missing required metadata in subscription:', subscription.id);
      return createJsonResponse({ error: 'Missing required metadata' }, 400);
    }

    // Handle tier change (upgrade/downgrade)
    if (action === 'tier_change' && existing_subscription_id) {
      console.log('[CheckoutHandler] Processing tier change from subscription:', existing_subscription_id, 'to new subscription:', subscription.id);
      
      try {
        // Cancel the old subscription
        await stripe.subscriptions.cancel(existing_subscription_id);
        console.log('[CheckoutHandler] Cancelled old subscription:', existing_subscription_id);

        // Remove old subscription from database
        await supabaseService
          .from('user_subscriptions')
          .delete()
          .eq('stripe_subscription_id', existing_subscription_id);

        console.log('[CheckoutHandler] Removed old subscription from database');
      } catch (error) {
        console.error('[CheckoutHandler] Error handling old subscription:', error);
        // Continue with new subscription creation even if old cleanup fails
      }
    }

    // Create/update subscription record in database
    const subscriptionData = {
      user_id,
      creator_id,
      tier_id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: 'active',
      current_period_start: subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null,
      amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
        subscription.items.data[0].price.unit_amount / 100 : 0,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[CheckoutHandler] Creating subscription record for tier:', tier_id);

    const { error: insertError } = await supabaseService
      .from('user_subscriptions')
      .insert(subscriptionData);

    if (insertError) {
      console.error('[CheckoutHandler] Error creating subscription record:', insertError);
      throw insertError;
    }

    console.log('[CheckoutHandler] Successfully created subscription record');

    // Clean up legacy subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user_id)
      .eq('creator_id', creator_id);

    console.log('[CheckoutHandler] Checkout webhook processing complete');
    return createJsonResponse({ success: true });

  } catch (error) {
    console.error('[CheckoutHandler] Error processing checkout webhook:', error);
    return createJsonResponse({ error: 'Failed to process checkout webhook' }, 500);
  }
}
