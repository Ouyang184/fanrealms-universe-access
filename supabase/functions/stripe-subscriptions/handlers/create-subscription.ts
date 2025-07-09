
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCreateSubscription(
  stripe: any,
  supabaseService: any,
  user: any,
  body: any
) {
  const { tierId, creatorId } = body;
  
  console.log('[CreateSubscription] Starting subscription creation:', {
    userId: user.id,
    tierId,
    creatorId
  });

  try {
    // Check for existing active subscriptions first
    const { data: existingSubs, error: checkError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('creator_id', creatorId)
      .in('status', ['active', 'incomplete']);

    if (checkError) {
      console.error('[CreateSubscription] Error checking existing subscriptions:', checkError);
      return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
    }

    // Handle existing active subscriptions
    if (existingSubs && existingSubs.length > 0) {
      const activeSub = existingSubs.find(sub => sub.status === 'active');
      const incompleteSub = existingSubs.find(sub => sub.status === 'incomplete');
      
      if (activeSub) {
        if (activeSub.tier_id === tierId) {
          console.log('[CreateSubscription] User already has active subscription to this tier');
          return createJsonResponse({ 
            error: 'You already have an active subscription to this tier.',
            shouldRefresh: true 
          });
        }
        
        // Different tier - this would be an upgrade/downgrade
        console.log('[CreateSubscription] User has subscription to different tier - upgrade/downgrade needed');
        // For now, return error. Tier changes can be implemented later if needed
        return createJsonResponse({ 
          error: 'You already have an active subscription to this creator. Please cancel your current subscription first.',
          shouldRefresh: true 
        });
      }
      
      if (incompleteSub && incompleteSub.tier_id === tierId) {
        console.log('[CreateSubscription] Found existing incomplete subscription, reusing...');
        
        // Try to retrieve the existing Stripe subscription
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(incompleteSub.stripe_subscription_id);
          
          if (stripeSubscription.status === 'incomplete') {
            const clientSecret = stripeSubscription.latest_invoice?.payment_intent?.client_secret;
            
            if (clientSecret) {
              return createJsonResponse({
                clientSecret,
                subscriptionId: stripeSubscription.id,
                amount: incompleteSub.amount * 100,
                tierName: body.tierName || 'Membership',
                tierId: tierId,
                creatorId: creatorId,
                useCustomPaymentPage: true,
                reusedSession: true
              });
            }
          }
        } catch (stripeError) {
          console.log('[CreateSubscription] Existing Stripe subscription not found, will create new one');
          
          // Clean up the orphaned database record
          await supabaseService
            .from('user_subscriptions')
            .delete()
            .eq('id', incompleteSub.id);
        }
      }
    }

    // Get tier details
    const { data: tier, error: tierError } = await supabaseService
      .from('membership_tiers')
      .select(`
        *,
        creators!inner(stripe_account_id, display_name)
      `)
      .eq('id', tierId)
      .single();

    if (tierError || !tier) {
      console.error('[CreateSubscription] Tier not found:', tierError);
      return createJsonResponse({ error: 'Membership tier not found' }, 404);
    }

    if (!tier.creators.stripe_account_id) {
      console.error('[CreateSubscription] Creator Stripe account not set up');
      return createJsonResponse({ error: 'Creator payments not set up' }, 400);
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);

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

      await supabaseService
        .from('membership_tiers')
        .update({ stripe_price_id: stripePriceId })
        .eq('id', tierId);
    }

    // Create Stripe subscription
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

    console.log('[CreateSubscription] Stripe subscription created:', subscription.id);

    // Store in database with conflict handling
    try {
      const { error: insertError } = await supabaseService
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
        
        // Handle unique constraint violations gracefully
        if (insertError.code === '23505') {
          console.log('[CreateSubscription] Duplicate subscription detected');
          
          // Cancel the Stripe subscription and return error
          await stripe.subscriptions.cancel(subscription.id);
          
          return createJsonResponse({ 
            error: 'You already have a subscription to this tier. Please refresh the page.',
            shouldRefresh: true 
          });
        }
        
        // For other errors, clean up and throw
        await stripe.subscriptions.cancel(subscription.id);
        throw insertError;
      }
    } catch (dbError) {
      console.error('[CreateSubscription] Database error:', dbError);
      
      // Clean up Stripe subscription
      try {
        await stripe.subscriptions.cancel(subscription.id);
      } catch (cleanupError) {
        console.error('[CreateSubscription] Failed to cleanup Stripe subscription:', cleanupError);
      }
      
      return createJsonResponse({ error: 'Failed to create subscription' }, 500);
    }

    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    
    console.log('[CreateSubscription] Successfully created subscription');
    
    return createJsonResponse({
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
    });

  } catch (error) {
    console.error('[CreateSubscription] Error:', error);
    return createJsonResponse({ 
      error: 'Failed to create subscription',
      details: error.message 
    }, 500);
  }
}

async function getOrCreateStripeCustomer(stripe: any, supabaseService: any, user: any) {
  // Check for existing customer
  const { data: existingCustomer } = await supabaseService
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingCustomer) {
    return existingCustomer.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email!,
    metadata: { user_id: user.id }
  });

  // Store customer ID
  await supabaseService
    .from('stripe_customers')
    .insert({
      user_id: user.id,
      stripe_customer_id: customer.id
    });

  return customer.id;
}
