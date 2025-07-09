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
    // Check for existing subscriptions - prioritize incomplete ones first
    const { data: existingSubs, error: checkError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('creator_id', creatorId)
      .eq('tier_id', tierId)
      .in('status', ['active', 'incomplete'])
      .order('created_at', { ascending: false });

    if (checkError) {
      console.error('[CreateSubscription] Error checking existing subscriptions:', checkError);
      return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
    }

    // Handle existing subscriptions
    if (existingSubs && existingSubs.length > 0) {
      const activeSub = existingSubs.find(sub => sub.status === 'active');
      const incompleteSub = existingSubs.find(sub => sub.status === 'incomplete');
      
      if (activeSub) {
        console.log('[CreateSubscription] User already has active subscription to this tier');
        return createJsonResponse({ 
          error: 'You already have an active subscription to this tier.',
          shouldRefresh: true 
        });
      }
      
      if (incompleteSub) {
        console.log('[CreateSubscription] Found existing incomplete subscription, attempting to reuse...', {
          subscriptionId: incompleteSub.stripe_subscription_id,
          createdAt: incompleteSub.created_at
        });
        
        // Try to retrieve the existing Stripe subscription
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(incompleteSub.stripe_subscription_id);
          
          console.log('[CreateSubscription] Retrieved Stripe subscription:', {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            hasLatestInvoice: !!stripeSubscription.latest_invoice
          });
          
          if (stripeSubscription.status === 'incomplete') {
            // Get the payment intent from the latest invoice
            let clientSecret = null;
            
            if (stripeSubscription.latest_invoice) {
              if (typeof stripeSubscription.latest_invoice === 'string') {
                // If it's just an ID, retrieve the full invoice
                const invoice = await stripe.invoices.retrieve(stripeSubscription.latest_invoice, {
                  expand: ['payment_intent']
                });
                clientSecret = invoice.payment_intent?.client_secret;
              } else {
                // If it's already expanded
                clientSecret = stripeSubscription.latest_invoice.payment_intent?.client_secret;
              }
            }
            
            if (clientSecret) {
              console.log('[CreateSubscription] Reusing existing incomplete subscription with client secret');
              
              // Get tier details for response
              const { data: tier } = await supabaseService
                .from('membership_tiers')
                .select('title, price')
                .eq('id', tierId)
                .single();
              
              return createJsonResponse({
                clientSecret,
                subscriptionId: stripeSubscription.id,
                amount: incompleteSub.amount * 100,
                tierName: tier?.title || 'Membership',
                tierId: tierId,
                creatorId: creatorId,
                useCustomPaymentPage: true,
                reusedSession: true
              });
            } else {
              console.log('[CreateSubscription] No valid client secret found, will create new subscription');
            }
          } else {
            console.log('[CreateSubscription] Existing subscription status changed, will create new one');
          }
        } catch (stripeError) {
          console.log('[CreateSubscription] Existing Stripe subscription not found or invalid, will create new one:', stripeError.message);
        }
        
        // If we reach here, the incomplete subscription is no longer valid
        // Clean up the orphaned database record
        console.log('[CreateSubscription] Removing invalid incomplete subscription record');
        await supabaseService
          .from('user_subscriptions')
          .delete()
          .eq('id', incompleteSub.id);
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
    
    console.log('[CreateSubscription] Successfully created new subscription');
    
    return createJsonResponse({
      clientSecret,
      subscriptionId: subscription.id,
      amount: tier.price * 100,
      tierName: tier.title,
      tierId: tierId,
      creatorId: creatorId,
      useCustomPaymentPage: true,
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
