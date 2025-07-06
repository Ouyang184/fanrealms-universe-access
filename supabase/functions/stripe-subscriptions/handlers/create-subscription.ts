
export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId }: { tierId: string; creatorId: string }
) {
  console.log('[CreateSubscription] Starting subscription creation for user:', user.id, 'tier:', tierId, 'creator:', creatorId);

  try {
    // Validate inputs
    if (!tierId || !creatorId) {
      throw new Error('Missing required parameters: tierId and creatorId');
    }

    if (!user?.id || !user?.email) {
      throw new Error('Invalid user data: missing id or email');
    }

    // Check for existing active subscriptions to the same creator
    console.log('[CreateSubscription] Checking for existing subscriptions...');
    const { data: existingSubscriptions, error: existingError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('creator_id', creatorId)
      .in('status', ['active', 'trialing']);

    if (existingError) {
      console.error('[CreateSubscription] Error checking existing subscriptions:', existingError);
      throw new Error(`Database error: ${existingError.message}`);
    }

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSub = existingSubscriptions[0];
      console.log('[CreateSubscription] Found existing subscription:', existingSub.id);
      
      if (existingSub.tier_id === tierId) {
        console.log('[CreateSubscription] User already subscribed to this tier');
        return { 
          error: 'You already have an active subscription to this tier.',
          shouldRefresh: true
        };
      }

      // Handle tier upgrade/downgrade
      console.log('[CreateSubscription] Handling tier change from', existingSub.tier_id, 'to', tierId);
      return await handleTierChange(stripe, supabase, user, existingSub, tierId);
    }

    // Get tier details
    console.log('[CreateSubscription] Fetching tier details...');
    const { data: tier, error: tierError } = await supabase
      .from('membership_tiers')
      .select(`
        *,
        creators!inner(stripe_account_id, display_name)
      `)
      .eq('id', tierId)
      .single();

    if (tierError) {
      console.error('[CreateSubscription] Error fetching tier:', tierError);
      throw new Error(`Failed to fetch tier: ${tierError.message}`);
    }

    if (!tier) {
      console.error('[CreateSubscription] Tier not found:', tierId);
      throw new Error('Membership tier not found');
    }

    if (!tier.creators?.stripe_account_id) {
      console.error('[CreateSubscription] Creator stripe account not set up:', creatorId);
      throw new Error('Creator payments not set up. Please contact the creator.');
    }

    console.log('[CreateSubscription] Tier found:', tier.title, 'Price:', tier.price);

    // Get or create Stripe customer
    console.log('[CreateSubscription] Getting or creating Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabase, user);
    console.log('[CreateSubscription] Stripe customer ID:', stripeCustomerId);

    // Create or get Stripe price
    console.log('[CreateSubscription] Creating or getting Stripe price...');
    let stripePriceId = tier.stripe_price_id;
    
    if (!stripePriceId) {
      console.log('[CreateSubscription] Creating new Stripe price...');
      try {
        const price = await stripe.prices.create({
          unit_amount: Math.round(tier.price * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
          product_data: { 
            name: `${tier.creators.display_name} - ${tier.title}`,
            description: tier.description 
          }
        });
        stripePriceId = price.id;
        console.log('[CreateSubscription] Created Stripe price:', stripePriceId);

        // Update tier with price ID
        await supabase
          .from('membership_tiers')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', tierId);
      } catch (priceError) {
        console.error('[CreateSubscription] Error creating Stripe price:', priceError);
        throw new Error(`Failed to create price: ${priceError.message}`);
      }
    }

    // Create Stripe subscription
    console.log('[CreateSubscription] Creating Stripe subscription...');
    try {
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

      console.log('[CreateSubscription] Stripe subscription created:', subscription.id, 'Status:', subscription.status);

      // Check if subscription is incomplete and needs payment
      if (subscription.status === 'incomplete') {
        const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
        
        if (!clientSecret) {
          console.error('[CreateSubscription] No client secret found for incomplete subscription');
          throw new Error('Payment setup failed - no client secret');
        }

        // Store subscription in database
        console.log('[CreateSubscription] Storing subscription in database...');
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
          console.error('[CreateSubscription] Error inserting subscription:', insertError);
          // Try to cancel the Stripe subscription
          try {
            await stripe.subscriptions.del(subscription.id);
          } catch (cancelError) {
            console.error('[CreateSubscription] Error canceling subscription after DB error:', cancelError);
          }
          throw new Error(`Database error: ${insertError.message}`);
        }

        console.log('[CreateSubscription] Subscription stored successfully');
        return {
          useCustomPaymentPage: true,
          clientSecret,
          subscriptionId: subscription.id,
          amount: tier.price * 100,
          tierName: tier.title,
          tierId,
          creatorId
        };
      }

      // If subscription is active immediately (shouldn't happen with payment_behavior: 'default_incomplete')
      console.log('[CreateSubscription] Subscription is immediately active');
      return {
        success: true,
        subscriptionId: subscription.id,
        message: 'Subscription created successfully'
      };

    } catch (stripeError) {
      console.error('[CreateSubscription] Stripe subscription creation error:', stripeError);
      throw new Error(`Stripe error: ${stripeError.message}`);
    }

  } catch (error) {
    console.error('[CreateSubscription] Error in handleCreateSubscription:', error);
    throw error;
  }
}

async function handleTierChange(stripe: any, supabase: any, user: any, existingSubscription: any, newTierId: string) {
  console.log('[CreateSubscription] Handling tier change...');
  
  try {
    // Get new tier details
    const { data: newTier, error: tierError } = await supabase
      .from('membership_tiers')
      .select(`
        *,
        creators!inner(stripe_account_id, display_name)
      `)
      .eq('id', newTierId)
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
        product_data: { 
          name: `${newTier.creators.display_name} - ${newTier.title}`,
          description: newTier.description 
        }
      });
      newStripePriceId = price.id;

      await supabase
        .from('membership_tiers')
        .update({ stripe_price_id: newStripePriceId })
        .eq('id', newTierId);
    }

    // Update the existing Stripe subscription
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
          tier_id: newTierId,
          platform_fee_percent: '4'
        }
      }
    );

    // Update database record
    await supabase
      .from('user_subscriptions')
      .update({
        tier_id: newTierId,
        amount: newTier.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);

    console.log('[CreateSubscription] Tier change completed successfully');
    return {
      success: true,
      message: 'Subscription tier updated successfully with proration applied',
      subscriptionId: updatedSubscription.id,
      isUpgrade: true
    };

  } catch (error) {
    console.error('[CreateSubscription] Error handling tier change:', error);
    throw new Error(`Failed to update subscription tier: ${error.message}`);
  }
}

async function getOrCreateStripeCustomer(stripe: any, supabase: any, user: any) {
  console.log('[CreateSubscription] Getting or creating Stripe customer for user:', user.id);
  
  try {
    // Check if customer already exists in our database
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      console.log('[CreateSubscription] Found existing customer:', existingCustomer.stripe_customer_id);
      return existingCustomer.stripe_customer_id;
    }

    // Create new Stripe customer
    console.log('[CreateSubscription] Creating new Stripe customer...');
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id }
    });

    console.log('[CreateSubscription] Created Stripe customer:', customer.id);

    // Store customer ID in database
    await supabase
      .from('stripe_customers')
      .insert({
        user_id: user.id,
        stripe_customer_id: customer.id
      });

    return customer.id;

  } catch (error) {
    console.error('[CreateSubscription] Error getting/creating Stripe customer:', error);
    throw new Error(`Customer creation failed: ${error.message}`);
  }
}
