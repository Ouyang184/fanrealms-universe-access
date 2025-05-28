
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY') || ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { action, tierId, creatorId, subscriptionId, paymentIntentId } = await req.json();
    console.log('Action:', action, 'TierId:', tierId, 'CreatorId:', creatorId);

    if (action === 'create_subscription') {
      // First, clean up any stale or duplicate subscriptions for this user/creator combination
      console.log('Cleaning up any existing subscriptions for user:', user.id, 'creator:', creatorId);
      
      const { data: existingSubs } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId);

      if (existingSubs && existingSubs.length > 0) {
        console.log('Found existing subscriptions:', existingSubs.length);
        
        // Check if any are actually active in Stripe
        let hasActiveStripeSubscription = false;
        for (const sub of existingSubs) {
          if (sub.stripe_subscription_id) {
            try {
              const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
              if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
                hasActiveStripeSubscription = true;
                break;
              }
            } catch (stripeError) {
              console.log('Stripe subscription not found:', sub.stripe_subscription_id);
            }
          }
        }

        if (hasActiveStripeSubscription) {
          return new Response(JSON.stringify({ 
            error: 'You already have an active subscription to this creator.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }

        // Clean up stale records
        console.log('Cleaning up stale subscription records');
        await supabase
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('creator_id', creatorId);
      }

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
      let stripeCustomerId: string;
      const { data: existingCustomer } = await supabase
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (existingCustomer) {
        stripeCustomerId = existingCustomer.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: { user_id: user.id }
        });
        stripeCustomerId = customer.id;

        await supabase
          .from('stripe_customers')
          .insert({
            user_id: user.id,
            stripe_customer_id: stripeCustomerId
          });
      }

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

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        application_fee_percent: 5,
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
          tier_id: tierId
        }
      });

      // Store pending subscription
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomerId,
          status: 'pending',
          amount: tier.price,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        });

      const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
      
      return new Response(JSON.stringify({
        clientSecret,
        subscriptionId: subscription.id,
        amount: tier.price * 100,
        tierName: tier.title
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'cancel_subscription') {
      console.log('Cancelling subscription:', subscriptionId);
      
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id, creator_id, tier_id')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .single();

      if (!subscription?.stripe_subscription_id) {
        throw new Error('Subscription not found');
      }

      // Cancel in Stripe
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

      // Remove from database completely to ensure clean state
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      console.log('Successfully cancelled and removed subscription');

      return new Response(JSON.stringify({ 
        success: true,
        creatorId: subscription.creator_id,
        tierId: subscription.tier_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get_user_subscriptions') {
      console.log('Getting user subscriptions for user:', user.id);
      
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

      // Verify each subscription with Stripe to ensure they're actually active
      const verifiedSubscriptions = [];
      if (subscriptions) {
        for (const sub of subscriptions) {
          if (sub.stripe_subscription_id) {
            try {
              const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
              if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
                verifiedSubscriptions.push(sub);
              } else {
                // Clean up stale record
                console.log('Cleaning up stale subscription record:', sub.id);
                await supabase
                  .from('user_subscriptions')
                  .delete()
                  .eq('id', sub.id);
              }
            } catch (stripeError) {
              // Subscription doesn't exist in Stripe, clean up
              console.log('Cleaning up orphaned subscription record:', sub.id);
              await supabase
                .from('user_subscriptions')
                .delete()
                .eq('id', sub.id);
            }
          }
        }
      }

      return new Response(JSON.stringify({ subscriptions: verifiedSubscriptions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get_creator_subscribers') {
      console.log('Getting creator subscribers for creator:', creatorId);
      
      const { data: subscribers } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          user:users(id, username, email, profile_picture),
          tier:membership_tiers(id, title, price)
        `)
        .eq('creator_id', creatorId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Verify each subscription with Stripe
      const verifiedSubscribers = [];
      if (subscribers) {
        for (const sub of subscribers) {
          if (sub.stripe_subscription_id) {
            try {
              const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
              if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
                verifiedSubscribers.push(sub);
              } else {
                // Clean up stale record
                console.log('Cleaning up stale subscriber record:', sub.id);
                await supabase
                  .from('user_subscriptions')
                  .delete()
                  .eq('id', sub.id);
              }
            } catch (stripeError) {
              // Subscription doesn't exist in Stripe, clean up
              console.log('Cleaning up orphaned subscriber record:', sub.id);
              await supabase
                .from('user_subscriptions')
                .delete()
                .eq('id', sub.id);
            }
          }
        }
      }

      return new Response(JSON.stringify({ subscribers: verifiedSubscribers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
