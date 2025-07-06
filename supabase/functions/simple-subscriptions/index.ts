
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use LIVE Stripe keys
const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_LIVE') || ''
);

// Helper function for consistent logging
const log = (step: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SimpleSubscriptions] ${step}`);
  if (data) {
    console.log(`[${timestamp}] [SimpleSubscriptions] Data:`, JSON.stringify(data, null, 2));
  }
};

// SUBSCRIPTION HANDLER FUNCTIONS
async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId }: { tierId: string; creatorId: string }
) {
  log('Action: create_subscription', { tierId, creatorId, userId: user.id });

  // Check for existing active subscriptions to the same creator (any tier)
  log('Checking for existing active subscriptions to creator:', creatorId);
  
  const { data: existingCreatorSubs, error: creatorSubsError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active']);

  if (creatorSubsError) {
    log('Error checking creator subscriptions:', creatorSubsError);
    throw new Error('Failed to check existing subscriptions');
  }

  // If user has an active subscription to this creator, handle tier change
  if (existingCreatorSubs && existingCreatorSubs.length > 0) {
    const existingSubscription = existingCreatorSubs[0];
    log('Found existing subscription to creator:', existingSubscription);
    
    // If it's the same tier, return error
    if (existingSubscription.tier_id === tierId) {
      log('User already subscribed to this tier');
      return { 
        error: 'You already have an active subscription to this tier.' 
      };
    }

    // Different tier - update existing subscription with proration
    return await handleTierUpdate(stripe, supabase, user, existingSubscription, tierId);
  }

  log('No conflicting active subscriptions found, proceeding with creation...');
  return await createNewSubscription(stripe, supabase, user, tierId, creatorId);
}

async function handleTierUpdate(stripe: any, supabase: any, user: any, existingSubscription: any, tierId: string) {
  log('Updating existing subscription to new tier with proration');
  
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

    log('Successfully updated subscription tier with proration');
    
    return {
      success: true,
      message: 'Subscription tier updated successfully with proration applied',
      subscriptionId: updatedSubscription.id
    };

  } catch (updateError) {
    log('Error updating subscription tier:', updateError);
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
  log('Cleaning up legacy subscriptions table');
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

  // Store subscription in user_subscriptions table
  log('Storing subscription in user_subscriptions table only');
  const { error: insertError } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      creator_id: creatorId,
      tier_id: tierId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      status: subscription.status,
      amount: tier.price,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (insertError) {
    log('Error inserting subscription:', insertError);
    throw new Error('Failed to create subscription record');
  }

  const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
  
  if (subscription.status === 'incomplete' && clientSecret) {
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

  return {
    success: true,
    subscriptionId: subscription.id,
    message: 'Subscription created successfully'
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

// CANCELLATION HANDLER FUNCTIONS
async function handleCancelSubscription(
  stripe: any,
  supabase: any,
  user: any,
  { tierId, creatorId, immediate }: { tierId: string; creatorId: string; immediate: boolean }
) {
  log('Cancelling subscription for tier:', tierId, 'creator:', creatorId, 'immediate:', immediate);
  
  // Find the active subscription in user_subscriptions table
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .eq('tier_id', tierId)
    .eq('status', 'active')
    .single();

  if (!subscription?.stripe_subscription_id) {
    throw new Error('Active subscription not found');
  }

  let canceledSubscription;
  let updateData;

  if (immediate) {
    // Cancel the subscription immediately in Stripe
    canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    
    // Update status to canceled immediately
    updateData = { 
      status: 'canceled' as const,
      cancel_at_period_end: false,
      current_period_end: null,
      cancel_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  } else {
    // Set to cancel at period end
    canceledSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });
    
    // Update with cancel at period end info
    updateData = { 
      cancel_at_period_end: true,
      current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  log('Updating subscription with data:', updateData);

  await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('id', subscription.id);

  log('Successfully cancelled subscription');

  return { 
    success: true,
    creatorId: subscription.creator_id,
    tierId: subscription.tier_id,
    immediate: immediate
  };
}

// DATA HANDLER FUNCTIONS
async function handleGetUserSubscriptions(supabase: any, user: any) {
  log('Getting user subscriptions for user:', user.id);
  
  // Get from user_subscriptions table - only include active subscriptions
  const { data: subscriptions } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      creator:creators(id, display_name, profile_image_url),
      tier:membership_tiers(id, title, description, price)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return { subscriptions: subscriptions || [] };
}

async function handleGetCreatorSubscribers(stripe: any, supabase: any, creatorId: string) {
  log('Getting creator subscribers for creator:', creatorId);
  
  // Get all tiers for this creator
  log('Fetching all tiers for creator:', creatorId);
  const { data: tiers } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('creator_id', creatorId);
  
  log('Found tiers for creator:', tiers?.map(t => ({ id: t.id, title: t.title, price: t.price, stripe_price_id: t.stripe_price_id })));
  
  if (!tiers || tiers.length === 0) {
    log('No tiers found for creator');
    return { subscribers: [] };
  }

  // Sync with Stripe for each tier
  await syncStripeSubscriptions(stripe, supabase, tiers, creatorId);
  
  // Get the synced data from user_subscriptions table
  log('Fetching final results from user_subscriptions table');

  const { data: subscribers, error: subscribersError } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      user:users(id, username, email, profile_picture),
      tier:membership_tiers(id, title, price)
    `)
    .eq('creator_id', creatorId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  log('Subscribers query error:', subscribersError);
  log('Final subscribers count:', subscribers?.length || 0);
  
  return { subscribers: subscribers || [] };
}

async function syncStripeSubscriptions(stripe: any, supabase: any, tiers: any[], creatorId: string) {
  log('Starting detailed Stripe sync for creator:', creatorId);
  
  for (const tier of tiers) {
    log('Processing tier:', tier.title, 'with stripe_price_id:', tier.stripe_price_id);
    
    if (!tier.stripe_price_id) {
      log('Tier has no stripe_price_id, skipping');
      continue;
    }
    
    try {
      log('Fetching ALL Stripe subscriptions for price:', tier.stripe_price_id);
      const stripeSubscriptions = await stripe.subscriptions.list({
        price: tier.stripe_price_id,
        status: 'all',
        limit: 100,
      });
      
      log('Found', stripeSubscriptions.data.length, 'total Stripe subscriptions for tier:', tier.title);
      
      const activeSubscriptions = stripeSubscriptions.data.filter(sub => sub.status === 'active');
      log('Active subscriptions for tier', tier.title + ':', activeSubscriptions.length);
      
      for (const stripeSub of activeSubscriptions) {
        log('Processing ACTIVE Stripe subscription:', stripeSub.id, 'status:', stripeSub.status);
        
        // Get customer details
        const customer = await stripe.customers.retrieve(stripeSub.customer as string);
        
        if (customer.deleted) {
          log('Customer deleted, skipping');
          continue;
        }
        
        log('Customer email:', customer.email);
        
        // Find user by email
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', customer.email)
          .single();
        
        if (!userData) {
          log('No user found for email:', customer.email);
          continue;
        }
        
        log('Found user:', userData.id, 'for subscription:', stripeSub.id);
        
        // Upsert subscription in user_subscriptions table
        const subscriptionData = {
          user_id: userData.id,
          creator_id: creatorId,
          tier_id: tier.id,
          stripe_subscription_id: stripeSub.id,
          stripe_customer_id: stripeSub.customer,
          status: 'active',
          amount: tier.price,
          current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSub.cancel_at_period_end || false,
          updated_at: new Date().toISOString()
        };
        
        log('Upserting subscription data:', subscriptionData);
        
        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert(subscriptionData, { 
            onConflict: 'user_id,creator_id,tier_id',
            ignoreDuplicates: false 
          });
        
        if (upsertError) {
          log('Error upserting subscription:', upsertError);
        } else {
          log('Successfully upserted subscription for user:', userData.id);
        }
      }
    } catch (error) {
      log('Error fetching Stripe subscriptions for tier:', tier.title, error);
    }
  }
}

// MAIN SERVE FUNCTION
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log('Function started', { method: req.method, url: req.url });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Create clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { action, tierId, creatorId, subscriptionId, paymentIntentId, immediate } = await req.json();
    log('Action:', action, 'TierId:', tierId, 'CreatorId:', creatorId, 'Immediate:', immediate);

    let result;

    switch (action) {
      case 'create_subscription':
        result = await handleCreateSubscription(stripe, supabase, user, { tierId, creatorId });
        break;

      case 'cancel_subscription':
        result = await handleCancelSubscription(stripe, supabase, user, { tierId, creatorId, immediate });
        break;

      case 'get_user_subscriptions':
        result = await handleGetUserSubscriptions(supabase, user);
        break;

      case 'get_creator_subscribers':
        result = await handleGetCreatorSubscribers(stripe, supabase, creatorId);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log('Error (LIVE MODE):', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
