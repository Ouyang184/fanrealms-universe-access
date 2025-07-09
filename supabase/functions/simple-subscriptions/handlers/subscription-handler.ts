import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId }: { tierId: string; creatorId: string }
) {
  console.log('[SimpleSubscriptions] Action: create_subscription, TierId:', tierId, 'CreatorId:', creatorId);

  // CRITICAL: Check for existing subscriptions - prioritize incomplete ones first
  console.log('[SimpleSubscriptions] Checking for existing subscriptions to creator:', creatorId, 'and tier:', tierId);
  
  const { data: existingSubs, error: subsError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .in('status', ['active', 'incomplete'])
    .order('created_at', { ascending: false });

  if (subsError) {
    console.error('[SimpleSubscriptions] Error checking subscriptions:', subsError);
    throw new Error('Failed to check existing subscriptions');
  }

  // Handle existing subscriptions
  if (existingSubs && existingSubs.length > 0) {
    const activeSub = existingSubs.find(sub => sub.status === 'active');
    const incompleteSub = existingSubs.find(sub => sub.status === 'incomplete');
    
    console.log('[SimpleSubscriptions] Found existing subscriptions:', {
      total: existingSubs.length,
      hasActive: !!activeSub,
      hasIncomplete: !!incompleteSub
    });
    
    // If user has an active subscription to this exact tier, return error
    if (activeSub) {
      console.log('[SimpleSubscriptions] User already subscribed to this tier');
      return { 
        error: 'You already have an active subscription to this tier.',
        shouldRefresh: true
      };
    }

    // If user has an incomplete subscription to this tier, try to reuse it
    if (incompleteSub) {
      console.log('[SimpleSubscriptions] Found incomplete subscription, attempting to reuse:', incompleteSub.stripe_subscription_id);
      
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(incompleteSub.stripe_subscription_id);
        
        if (stripeSubscription.status === 'incomplete') {
          // Retrieve the payment intent
          let clientSecret = null;
          
          if (stripeSubscription.latest_invoice) {
            if (typeof stripeSubscription.latest_invoice === 'string') {
              const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice, {
                expand: ['payment_intent']
              });
              clientSecret = invoice.payment_intent?.client_secret;
            } else {
              clientSecret = stripeSubscription.latest_invoice.payment_intent?.client_secret;
            }
          }
          
          if (clientSecret) {
            console.log('[SimpleSubscriptions] Reusing existing incomplete subscription');
            
            // Get tier details for response
            const { data: tier } = await supabase
              .from('membership_tiers')
              .select('title, price')
              .eq('id', tierId)
              .single();
            
            return {
              clientSecret,
              subscriptionId: stripeSubscription.id,
              amount: incompleteSub.amount * 100,
              tierName: tier?.title || 'Membership',
              tierId: tierId,
              creatorId: creatorId,
              useCustomPaymentPage: true,
              reusedSession: true
            };
          }
        }
        
        console.log('[SimpleSubscriptions] Existing subscription no longer incomplete, cleaning up');
      } catch (stripeError) {
        console.log('[SimpleSubscriptions] Error retrieving existing subscription, cleaning up:', stripeError.message);
      }
      
      // Clean up invalid incomplete subscription
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', incompleteSub.id);
    }
  }

  // Check for different tier to same creator (would be upgrade/downgrade)
  const { data: existingCreatorSubs, error: creatorSubsError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .neq('tier_id', tierId)
    .in('status', ['active']);

  if (creatorSubsError) {
    console.error('[SimpleSubscriptions] Error checking creator subscriptions:', creatorSubsError);
    throw new Error('Failed to check existing subscriptions');
  }

  // If user has an active subscription to this creator but different tier, handle tier change
  if (existingCreatorSubs && existingCreatorSubs.length > 0) {
    const existingSubscription = existingCreatorSubs[0];
    console.log('[SimpleSubscriptions] Found existing subscription to different tier, updating:', existingSubscription);
    
    return await handleTierUpdate(stripe, supabase, user, existingSubscription, tierId);
  }

  console.log('[SimpleSubscriptions] No conflicting subscriptions found, proceeding with creation...');
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

    // Update database record using a transaction to handle potential conflicts
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        tier_id: tierId,
        amount: newTier.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);

    if (updateError) {
      console.error('[SimpleSubscriptions] Error updating subscription record:', updateError);
      throw new Error('Failed to update subscription record');
    }

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
  // Clean up old failed subscriptions (older than 1 hour) but keep recent incomplete ones
  await supabase
    .from('user_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['canceled', 'failed']);

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

  // Allow incomplete subscriptions for payment confirmation flow
  console.log('[SimpleSubscriptions] Subscription created with status:', subscription.status);

  // Store subscription in user_subscriptions table with conflict handling
  console.log('[SimpleSubscriptions] Storing subscription in user_subscriptions table with duplicate prevention');
  
  try {
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
      
      // Handle duplicate subscription attempts gracefully
      if (insertError.code === '23505') { // Unique violation
        console.log('[SimpleSubscriptions] Duplicate subscription detected, checking existing subscription...');
        
        // Check if user already has an active subscription to this tier
        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('creator_id', creatorId)
          .eq('tier_id', tierId)
          .eq('status', 'active')
          .single();

        if (existingSubscription) {
          // Cancel the Stripe subscription we just created
          await stripe.subscriptions.cancel(subscription.id);
          
          return {
            error: 'You already have an active subscription to this tier.',
            shouldRefresh: true
          };
        }
      }
      
      throw new Error('Failed to create subscription record');
    }
  } catch (dbError) {
    console.error('[SimpleSubscriptions] Database error during subscription creation:', dbError);
    
    // Clean up the Stripe subscription if database insertion fails
    try {
      await stripe.subscriptions.cancel(subscription.id);
      console.log('[SimpleSubscriptions] Cleaned up Stripe subscription due to database error');
    } catch (cleanupError) {
      console.error('[SimpleSubscriptions] Failed to cleanup Stripe subscription:', cleanupError);
    }
    
    throw new Error('Failed to create subscription due to database error');
  }

  const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
  
  return {
    clientSecret,
    subscriptionId: subscription.id,
    amount: tier.price * 100,
    tierName: tier.title,
    tierId: tierId,
    creatorId: creatorId,
    useCustomPaymentPage: true,
    isUpgrade: false,
    currentTierName: null,
    proratedAmount: 0,
    fullTierPrice: tier.price * 100,
    currentPeriodEnd: null,
    reusedSession: false
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
