
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
    const meta = session.metadata ?? {};

    // Bundle purchase branch
    if (meta.kind === 'bundle' || meta.bundle_id) {
      return await handleBundlePurchase(session, supabaseService);
    }

    // One-time marketplace purchase
    const { product_id, buyer_id, creator_id } = meta;

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

    if (!product) {
      console.error('[CheckoutHandler] Product not found:', product_id);
      throw new Error(`Product not found: ${product_id}`);
    }

    // Verify creator_id from metadata matches the product's actual creator
    if (product.creator_id !== creator_id) {
      console.error('[CheckoutHandler] creator_id mismatch — metadata vs product:', creator_id, product.creator_id);
      throw new Error('Creator ID mismatch between metadata and product record');
    }

    const { data: creatorRow } = await supabaseService
      .from('creators')
      .select('platform_fee_rate')
      .eq('id', product.creator_id)
      .maybeSingle();

    const feeRate = Math.min(Math.max(creatorRow?.platform_fee_rate ?? 5, 1), 5);
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

async function handleBundlePurchase(session: any, supabaseService: any) {
  const { bundle_id, buyer_id, creator_id } = session.metadata ?? {};
  if (!bundle_id || !buyer_id || !creator_id) {
    console.log('[BundleHandler] Missing metadata, skipping');
    return createJsonResponse({ success: true });
  }

  // Idempotency
  const { data: existing } = await supabaseService
    .from('bundle_purchases')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();
  if (existing) {
    console.log('[BundleHandler] Already processed', session.id);
    return createJsonResponse({ success: true });
  }

  const { data: bundle, error: bundleErr } = await supabaseService
    .from('bundles')
    .select('id, bundle_price, creator_id, bundle_items(project_id)')
    .eq('id', bundle_id)
    .maybeSingle();
  if (bundleErr || !bundle) {
    console.error('[BundleHandler] Bundle not found:', bundleErr);
    throw bundleErr ?? new Error('Bundle not found');
  }
  if (bundle.creator_id !== creator_id) {
    throw new Error('Bundle creator_id mismatch');
  }

  const amountPaidCents = session.amount_total ?? bundle.bundle_price;
  const amountPaid = amountPaidCents / 100;

  // Insert bundle_purchases (service role)
  const { error: bpErr } = await supabaseService
    .from('bundle_purchases')
    .insert({
      buyer_id,
      bundle_id,
      stripe_session_id: session.id,
      amount_paid: amountPaidCents,
    });
  if (bpErr) {
    console.error('[BundleHandler] Insert bundle_purchases failed:', bpErr);
    throw bpErr;
  }

  const projectIds = (bundle.bundle_items ?? []).map((bi: any) => bi.project_id).filter(Boolean);
  if (projectIds.length === 0) {
    console.log('[BundleHandler] Bundle has no items — recorded purchase only');
    return createJsonResponse({ success: true });
  }

  // Find published digital_products linked to those projects (one per project preferred)
  const { data: products, error: prodErr } = await supabaseService
    .from('digital_products')
    .select('id, price, project_id, creator_id, status')
    .in('project_id', projectIds)
    .eq('status', 'published');
  if (prodErr) {
    console.error('[BundleHandler] Product fetch failed:', prodErr);
    throw prodErr;
  }

  if (!products || products.length === 0) {
    console.log('[BundleHandler] No published products in bundle projects');
    return createJsonResponse({ success: true });
  }

  // Fee allocation
  const { data: creatorRow } = await supabaseService
    .from('creators')
    .select('platform_fee_rate')
    .eq('id', creator_id)
    .maybeSingle();
  const feeRate = Math.min(Math.max(creatorRow?.platform_fee_rate ?? 5, 1), 5);
  const { data: stripeAcct } = await supabaseService
    .from('creator_stripe_accounts')
    .select('stripe_charges_enabled')
    .eq('creator_id', creator_id)
    .maybeSingle();
  const hasConnect = !!stripeAcct?.stripe_charges_enabled;

  // Allocate amount proportionally by listed price; fallback to equal split
  const sumPrice = products.reduce((s: number, p: any) => s + Number(p.price ?? 0), 0);
  for (const p of products) {
    const share = sumPrice > 0
      ? amountPaid * (Number(p.price ?? 0) / sumPrice)
      : amountPaid / products.length;
    const amount = parseFloat(share.toFixed(2));
    const platformFee = parseFloat((amount * feeRate / 100).toFixed(2));
    const netAmount = parseFloat((amount - platformFee).toFixed(2));

    // Skip if buyer already owns this product
    const { data: dup } = await supabaseService
      .from('purchases')
      .select('id')
      .eq('buyer_id', buyer_id)
      .eq('product_id', p.id)
      .eq('status', 'completed')
      .maybeSingle();
    if (dup) continue;

    const { data: inserted, error: pErr } = await supabaseService
      .from('purchases')
      .insert({
        buyer_id,
        product_id: p.id,
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
    if (pErr) {
      console.error('[BundleHandler] Insert purchase failed for product', p.id, pErr);
      continue;
    }

    const { error: eErr } = await supabaseService
      .from('creator_earnings')
      .insert({
        creator_id,
        purchase_id: inserted.id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        earning_type: 'marketplace',
        status: hasConnect ? 'transferred' : 'pending',
      });
    if (eErr) console.error('[BundleHandler] earnings insert failed:', eErr);
  }

  console.log('[BundleHandler] Bundle purchase recorded for', products.length, 'products');
  return createJsonResponse({ success: true });
}
