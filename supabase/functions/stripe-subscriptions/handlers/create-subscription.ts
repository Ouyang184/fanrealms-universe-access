
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getOrCreateStripeCustomer } from '../services/stripe-customer.ts';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCreateSubscription(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('Creating subscription for user:', user.id);
  console.log('Request body:', JSON.stringify(body, null, 2));

  // Extract parameters from body - handle both formats
  const tierId = body.tierId || body.tier_id;
  const creatorId = body.creatorId || body.creator_id;

  console.log('Extracted params:', { tierId, creatorId });

  if (!tierId || !creatorId) {
    console.log('ERROR: Missing tierId or creatorId', { tierId, creatorId });
    return createJsonResponse({ error: 'Missing tierId or creatorId' }, 400);
  }

  // Create service client for database operations
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Check for existing active subscriptions to the same creator
  console.log('Checking for existing active subscriptions to creator:', creatorId);
  const { data: existingSubscriptions, error: checkError } = await supabaseService
    .from('user_subscriptions')
    .select('*, membership_tiers!inner(title, price)')
    .eq('user_id', user.id)
    .eq('creator_id', creatorId)
    .in('status', ['active', 'trialing']);

  if (checkError) {
    console.error('Error checking existing subscriptions:', checkError);
    return createJsonResponse({ error: 'Failed to check existing subscriptions' }, 500);
  }

  let isUpgrade = false;
  let existingSubscription = null;

  // If user has existing active subscription to this creator, check if it's an upgrade
  if (existingSubscriptions && existingSubscriptions.length > 0) {
    existingSubscription = existingSubscriptions[0];
    console.log('Found existing active subscription:', existingSubscription);
    
    // Check if user is trying to subscribe to a different tier (upgrade/downgrade)
    if (existingSubscription.tier_id !== tierId) {
      isUpgrade = true;
      console.log('Detected tier upgrade/change from:', existingSubscription.tier_id, 'to:', tierId);
    } else {
      // Same tier - return error
      return createJsonResponse({ 
        error: 'You already have an active subscription to this tier.',
        shouldRefresh: true
      }, 200);
    }
  }

  console.log('Subscription type:', isUpgrade ? 'UPGRADE' : 'NEW');

  // Get tier and creator details
  console.log('Fetching tier and creator details...');
  const { data: tier, error: tierError } = await supabase
    .from('membership_tiers')
    .select(`
      *,
      creators!inner(
        stripe_account_id,
        display_name
      )
    `)
    .eq('id', tierId)
    .single();

  if (tierError || !tier) {
    console.log('ERROR: Tier not found:', tierError);
    return createJsonResponse({ error: 'Membership tier not found' }, 404);
  }

  console.log('Tier found:', tier.title, 'Price:', tier.price);

  if (!tier.creators.stripe_account_id) {
    console.log('ERROR: Creator not connected to Stripe');
    return createJsonResponse({ 
      error: 'This creator has not set up payments yet. Please try again later.' 
    }, 400);
  }

  if (!tier.stripe_price_id) {
    console.log('ERROR: Tier missing stripe_price_id');
    return createJsonResponse({ 
      error: 'This membership tier is not properly configured. Please contact the creator.' 
    }, 400);
  }

  try {
    // Create or get Stripe customer
    console.log('Creating/getting Stripe customer...');
    const stripeCustomerId = await getOrCreateStripeCustomer(stripe, supabaseService, user);
    console.log('Stripe customer ID:', stripeCustomerId);

    // Clean up any existing pending subscriptions
    console.log('Cleaning up old pending subscriptions...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    await supabaseService
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('creator_id', creatorId)
      .in('status', ['pending', 'incomplete'])
      .lt('created_at', oneHourAgo);

    // Create Stripe Checkout Session for subscription
    console.log('Creating Stripe Checkout Session...');
    
    const sessionData: any = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: tier.stripe_price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/creator/${creatorId}`,
      metadata: {
        user_id: user.id,
        creator_id: creatorId,
        tier_id: tierId,
        tier_name: tier.title,
        creator_name: tier.creators.display_name,
        is_upgrade: isUpgrade ? 'true' : 'false',
        existing_subscription_id: existingSubscription?.stripe_subscription_id || '',
        action: isUpgrade ? 'tier_change' : 'new_subscription'
      }
    };

    // For upgrades, we need special handling
    if (isUpgrade && existingSubscription?.stripe_subscription_id) {
      sessionData.subscription_data = {
        metadata: {
          user_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          tier_name: tier.title,
          creator_name: tier.creators.display_name,
          is_upgrade: 'true',
          existing_subscription_id: existingSubscription.stripe_subscription_id,
          action: 'tier_change'
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    console.log('Checkout session created:', session.id);

    return createJsonResponse({
      checkout_url: session.url,
      session_id: session.id,
      isUpgrade: isUpgrade,
      tierName: tier.title,
      currentTierName: existingSubscription?.membership_tiers?.title || null
    });

  } catch (error) {
    console.error('Error in create subscription:', error);
    return createJsonResponse({ 
      error: 'Failed to create subscription. Please try again later.' 
    }, 500);
  }
}
