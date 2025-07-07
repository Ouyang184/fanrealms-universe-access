
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId }: { tierId: string; creatorId: string }
) {
  console.log('[SimpleSubscriptions] Action: create_subscription, TierId:', tierId, 'CreatorId:', creatorId);

  // CRITICAL: Check for existing active subscriptions to the same creator (any tier)
  console.log('[SimpleSubscriptions] Checking for existing active subscriptions to creator:', creatorId);
  
  const { data: existingCreatorSubs, error: creatorSubsError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active']);

  if (creatorSubsError) {
    console.error('[SimpleSubscriptions] Error checking creator subscriptions:', creatorSubsError);
    throw new Error('Failed to check existing subscriptions');
  }

  // If user has an active subscription to this creator, handle tier change
  if (existingCreatorSubs && existingCreatorSubs.length > 0) {
    const existingSubscription = existingCreatorSubs[0];
    console.log('[SimpleSubscriptions] Found existing subscription to creator:', existingSubscription);
    
    // If it's the same tier, return error
    if (existingSubscription.tier_id === tierId) {
      console.log('[SimpleSubscriptions] User already subscribed to this tier');
      return { 
        error: 'You already have an active subscription to this tier.' 
      };
    }

    // Different tier - update existing subscription with proration
    return await handleTierUpdate(stripe, supabase, user, existingSubscription, tierId);
  }

  console.log('[SimpleSubscriptions] No conflicting active subscriptions found, proceeding with creation...');
  return await createNewSubscription(stripe, supabase, user, tierId, creatorId);
}

async function handleTierUpdate(stripe: any, supabase: any, user: any, existingSubscription: any, tierId: string) {
  console.log('[SimpleSubscriptions] Updating existing subscription to new tier with proration');
  
  // Get new tier details
  const { data: newTier, error: tierError } = await supabase
    .from('membership_tiers')
    .select(`
      *,
      creators!inner(stripe_account_id, display_name)
    `)
    .eq('id', tierId)
    .single();

  if (tierError || !newTier) {
    throw new Error('New tier not found');
  }

  // Create new price if needed
  let newStripePriceId = newTier.stripe_price_id;
  if (!newStripePriceId) {
    const price = await stripe.prices.create({
      unit_amount: Math.round(newTier.price * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: { name: newTier.title }
    });
    newStripePriceId = price.id;

    await supabase
      .from('membership_tiers')
      .update({ stripe_price_id: newStripePriceId })
      .eq('id', tierId);
  }

  // Update the existing Stripe subscription with proration
  try {
    const updatedSubscription = await stripe.subscriptions.update(
      existingSubscription.stripe_subscription_id,
      {
        items: [{
          id: (await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id)).items.data[0].id,
          price: newStripePriceId,
        }],
        proration_behavior: 'always_invoice',
        metadata: {
          user_id: user.id,
          creator_id: existingSubscription.creator_id,
          tier_id: tierId,
          platform_fee_percent: '4'
        }
      }
    );

    // Update database record
    await supabase
      .from('user_subscriptions')
      .update({
        tier_id: tierId,
        amount: newTier.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);

    console.log('[SimpleSubscriptions] Successfully updated subscription tier with proration');
    
    return {
      success: true,
      message: 'Subscription tier updated successfully with proration applied',
      subscriptionId: updatedSubscription.id
    };

  } catch (updateError) {
    console.error('[SimpleSubscriptions] Error updating subscription tier:', updateError);
    throw new Error('Failed to update subscription tier');
  }
}

async function createNewSubscription(stripe: any, supabase: any, user: any, tierId: string, creatorId: string) {
  // Clean up any non-active subscriptions for this user/creator combination
  await supabase
    .from('user_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .neq('status', 'active');

  // Clean up ALL records from legacy subscriptions table for this user/creator
  console.log('[SimpleSubscriptions] Cleaning up legacy subscriptions table');
  await supabase
    .from('subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId);

  // Get tier details
  const { data: tier, error: tierError } = await supabase
    .from('membership_tiers')
    .select(`
      *,
      creators!inner(stripe_account_id, display_name)
    `)
    .eq('id', tierId)
    .single();

  if (tierError || !tier) {
    throw new Error('Tier not found');
  }

  if (!tier.creators.stripe_account_id) {
    throw new Error('Creator payments not set up');
  }

  // Get or create Stripe customer
  const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabase, user);

  // Create Stripe price if needed
  let stripePriceId = tier.stripe_price_id;
  if (!stripePriceId) {
    const price = await stripe.prices.create({
      unit_amount: Math.round(tier.price * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product_data: { name: tier.title }
    });
    stripePriceId = price.id;

    await supabase
      .from('membership_tiers')
      .update({ stripe_price_id: stripePriceId })
      .eq('id', tierId);
  }

  // Create Stripe subscription with 4% platform fee
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: stripePriceId }],
    application_fee_percent: 4,
    transfer_data: { destination: tier.creators.stripe_account_id },
    payment_behavior: 'default_incomplete',
    payment_settings: { 
      save_default_payment_method: 'on_subscription',
      payment_method_types: ['card']
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      user_id: user.id,
      creator_id: creatorId,
      tier_id: tierId,
      platform_fee_percent: '4'
    }
  });

  // AUTO-DELETE INCOMPLETE SUBSCRIPTIONS
  if (subscription.status === 'incomplete') {
    console.log('[SimpleSubscriptions] Subscription created with incomplete status, auto-deleting...');
    
    try {
      await stripe.subscriptions.del(subscription.id);
      console.log('[SimpleSubscriptions] Auto-deleted incomplete subscription:', subscription.id);
      
      return { 
        error: 'Payment setup incomplete. Please try again with valid payment information.' 
      };
    } catch (deleteError) {
      console.error('[SimpleSubscriptions] Error auto-deleting incomplete subscription:', deleteError);
    }
  }

  // Store subscription in user_subscriptions table
  console.log('[SimpleSubscriptions] Storing subscription in user_subscriptions table only');
  const { error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      creator_id: creatorId,
      tier_id: tierId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      status: 'incomplete',
      amount: tier.price,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (insertError) {
    console.error('[SimpleSubscriptions] Error inserting subscription:', insertError);
    throw new Error('Failed to create subscription record');
  }

  const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
  
  return {
    clientSecret,
    subscriptionId: subscription.id,
    amount: tier.price * 100,
    tierName: tier.title
  };
}

async function getOrCreateStripeCustomer(stripe: any, supabase: any, user: any) {
  const { data: existingCustomer } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (existingCustomer) {
    return existingCustomer.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: user.email!,
    metadata: { user_id: user.id }
  });

  await supabase
    .from('stripe_customers')
    .insert({
      user_id: user.id,
      stripe_customer_id: customer.id
    });

  return customer.id;
}
