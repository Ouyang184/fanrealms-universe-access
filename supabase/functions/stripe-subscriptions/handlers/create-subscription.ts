
// Helper function for consistent logging
const log = (step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CreateSubscription] ${step}`);
  if (data) {
    console.log(`[${timestamp}] [CreateSubscription] Data:`, JSON.stringify(data, null, 2));
  }
};

export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId }: { tierId: string; creatorId: string }
) {
  log('Starting subscription creation', { userId: user.id, tierId, creatorId });

  try {
    // Validate inputs
    if (!tierId || !creatorId) {
      throw new Error('Missing required parameters: tierId and creatorId');
    }

    if (!user?.id || !user?.email) {
      throw new Error('Invalid user data: missing id or email');
    }

    log('Input validation passed');

    // Check for existing active subscriptions to the same creator
    let existingSubscriptions;
    try {
      log('Checking for existing subscriptions...');
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .in('status', ['active', 'trialing']);

      if (error) {
        log('Database error checking subscriptions', error);
        throw new Error(`Database error: ${error.message}`);
      }

      existingSubscriptions = data;
      log('Existing subscriptions check completed', { count: existingSubscriptions?.length || 0 });
    } catch (dbError) {
      throw new Error(`Failed to check existing subscriptions: ${dbError.message}`);
    }

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      const existingSub = existingSubscriptions[0];
      log('Found existing subscription', { subscriptionId: existingSub.id, status: existingSub.status });
      
      if (existingSub.tier_id === tierId) {
        log('User already subscribed to this tier');
        return { 
          error: 'You already have an active subscription to this tier.',
          shouldRefresh: true
        };
      }

      // Handle tier upgrade/downgrade
      log('Handling tier change', { from: existingSub.tier_id, to: tierId });
      return await handleTierChange(stripe, supabase, user, existingSub, tierId);
    }

    // Get tier details with creator information
    let tier;
    try {
      log('Fetching tier details...');
      const { data, error } = await supabase
        .from('membership_tiers')
        .select(`
          *,
          creators!inner(stripe_account_id, display_name)
        `)
        .eq('id', tierId)
        .single();

      if (error) {
        log('Database error fetching tier', error);
        throw new Error(`Failed to fetch tier: ${error.message}`);
      }

      if (!data) {
        throw new Error('Membership tier not found');
      }

      tier = data;
      log('Tier details fetched', { 
        tierTitle: tier.title, 
        price: tier.price,
        creatorName: tier.creators?.display_name,
        hasStripeAccount: !!tier.creators?.stripe_account_id
      });
    } catch (tierError) {
      throw new Error(`Failed to fetch tier details: ${tierError.message}`);
    }

    // Validate creator has Stripe setup
    if (!tier.creators?.stripe_account_id) {
      log('Creator stripe account not set up');
      throw new Error('Creator payments not set up. Please contact the creator.');
    }

    // Get or create Stripe customer
    let stripeCustomerId;
    try {
      log('Getting or creating Stripe customer...');
      stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabase, user);
      log('Stripe customer ready', { customerId: stripeCustomerId });
    } catch (customerError) {
      throw new Error(`Customer setup failed: ${customerError.message}`);
    }

    // Create Stripe Checkout Session instead of subscription with payment intent
    try {
      log('Creating Stripe Checkout Session...');
      
      // Get or create Stripe price
      let stripePriceId = tier.stripe_price_id;
      
      if (!stripePriceId) {
        log('Creating new Stripe price...');
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
        log('Stripe price created', { priceId: stripePriceId });

        // Update tier with price ID
        await supabase
          .from('membership_tiers')
          .update({ stripe_price_id: stripePriceId })
          .eq('id', tierId);
        
        log('Tier updated with price ID');
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [{
          price: stripePriceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/subscriptions?success=true`,
        cancel_url: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/creator/${tier.creators.display_name}?canceled=true`,
        application_fee_percent: 4,
        subscription_data: {
          application_fee_percent: 4,
          transfer_data: {
            destination: tier.creators.stripe_account_id,
          },
          metadata: {
            user_id: user.id,
            creator_id: creatorId,
            tier_id: tierId,
            platform_fee_percent: '4'
          }
        }
      });

      log('Stripe Checkout Session created', { 
        sessionId: session.id, 
        url: session.url 
      });

      return {
        url: session.url,
        sessionId: session.id
      };

    } catch (stripeError) {
      log('Stripe error', stripeError);
      throw new Error(`Stripe error: ${stripeError.message}`);
    }

  } catch (error) {
    log('Error in handleCreateSubscription', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  }
}

async function handleTierChange(stripe: any, supabase: any, user: any, existingSubscription: any, newTierId: string) {
  log('Handling tier change', { 
    from: existingSubscription.tier_id, 
    to: newTierId,
    subscriptionId: existingSubscription.stripe_subscription_id 
  });
  
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
      throw new Error(`New tier not found: ${tierError?.message || 'No tier data'}`);
    }

    log('New tier fetched', { tierTitle: newTier.title, price: newTier.price });

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
      
      log('New price created and tier updated', { priceId: newStripePriceId });
    }

    // Get current subscription from Stripe to get items
    const currentSubscription = await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id);
    
    // Update the existing Stripe subscription
    const updatedSubscription = await stripe.subscriptions.update(
      existingSubscription.stripe_subscription_id,
      {
        items: [{
          id: currentSubscription.items.data[0].id,
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

    log('Stripe subscription updated', { subscriptionId: updatedSubscription.id });

    // Update database record
    await supabase
      .from('user_subscriptions')
      .update({
        tier_id: newTierId,
        amount: newTier.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSubscription.id);

    log('Database record updated');

    return {
      success: true,
      message: 'Subscription tier updated successfully with proration applied',
      subscriptionId: updatedSubscription.id,
      isUpgrade: true
    };

  } catch (error) {
    log('Error handling tier change', { error: error.message });
    throw new Error(`Failed to update subscription tier: ${error.message}`);
  }
}

async function getOrCreateStripeCustomer(stripe: any, supabase: any, user: any) {
  log('Getting or creating Stripe customer', { userId: user.id, email: user.email });
  
  try {
    // Check if customer already exists in our database
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      log('Found existing customer in database', { customerId: existingCustomer.stripe_customer_id });
      
      // Verify customer exists in Stripe
      try {
        await stripe.customers.retrieve(existingCustomer.stripe_customer_id);
        return existingCustomer.stripe_customer_id;
      } catch (stripeError) {
        log('Customer not found in Stripe, will create new one', { error: stripeError.message });
      }
    }

    // Create new Stripe customer
    log('Creating new Stripe customer...');
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id }
    });

    log('Stripe customer created', { customerId: customer.id });

    // Store customer ID in database
    await supabase
      .from('stripe_customers')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customer.id
      }, {
        onConflict: 'user_id'
      });

    log('Customer stored in database');

    return customer.id;

  } catch (error) {
    log('Error getting/creating Stripe customer', { error: error.message });
    throw new Error(`Customer creation failed: ${error.message}`);
  }
}
