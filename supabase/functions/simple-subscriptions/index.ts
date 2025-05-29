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
    console.log('[SimpleSubscriptions] Action:', action, 'TierId:', tierId, 'CreatorId:', creatorId);

    if (action === 'create_subscription') {
      // CRITICAL: Check for existing active subscriptions FIRST
      console.log('[SimpleSubscriptions] Checking for existing active subscriptions for user:', user.id, 'creator:', creatorId, 'tier:', tierId);
      
      const { data: existingActiveSubs, error: activeSubsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .in('status', ['active']); // Removed 'trialing' as we're not using it

      if (activeSubsError) {
        console.error('[SimpleSubscriptions] Error checking active subscriptions:', activeSubsError);
        throw new Error('Failed to check existing subscriptions');
      }

      if (existingActiveSubs && existingActiveSubs.length > 0) {
        console.log('[SimpleSubscriptions] Found existing active subscription:', existingActiveSubs[0]);
        return new Response(JSON.stringify({ 
          error: 'You already have an active subscription to this tier.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }

      console.log('[SimpleSubscriptions] No existing active subscriptions found, proceeding...');

      // Clean up any non-active subscriptions for this user/creator/tier combination in user_subscriptions
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
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

      // Check if customer already has an active subscription to this tier in Stripe
      console.log('[SimpleSubscriptions] Checking Stripe for existing subscriptions...');
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 100,
      });

      // Check if any active subscription matches our tier
      for (const stripeSub of stripeSubscriptions.data) {
        if (stripeSub.metadata?.tier_id === tierId && stripeSub.metadata?.creator_id === creatorId) {
          console.log('[SimpleSubscriptions] Found existing Stripe subscription for this tier');
          
          // Ensure our database is in sync
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: user.id,
              creator_id: creatorId,
              tier_id: tierId,
              stripe_subscription_id: stripeSub.id,
              stripe_customer_id: stripeCustomerId,
              status: 'active',
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              amount: tier.price,
              updated_at: new Date().toISOString(),
            }, { 
              onConflict: 'user_id,creator_id,tier_id',
              ignoreDuplicates: false 
            });

          return new Response(JSON.stringify({ 
            error: 'You already have an active subscription to this tier.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }
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

      // Create Stripe subscription with proper metadata
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

      // Store pending subscription in user_subscriptions table ONLY
      console.log('[SimpleSubscriptions] Storing subscription in user_subscriptions table only');
      const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          creator_id: creatorId,
          tier_id: tierId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: stripeCustomerId,
          status: 'incomplete', // Start with incomplete instead of pending
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
      
      return new Response(JSON.stringify({
        clientSecret,
        subscriptionId: subscription.id,
        amount: tier.price * 100,
        tierName: tier.title
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'cancel_subscription') {
      console.log('[SimpleSubscriptions] Cancelling subscription for tier:', tierId, 'creator:', creatorId);
      
      // Find the active subscription in user_subscriptions table ONLY
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

      // Cancel the subscription immediately in Stripe
      const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

      // Update status to canceled in user_subscriptions table ONLY
      const updateData = { 
        status: 'canceled' as const,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      };

      console.log('[SimpleSubscriptions] Updating subscription with data:', updateData);

      await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscription.id);

      console.log('[SimpleSubscriptions] Successfully canceled subscription');

      return new Response(JSON.stringify({ 
        success: true,
        creatorId: subscription.creator_id,
        tierId: subscription.tier_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get_user_subscriptions') {
      console.log('[SimpleSubscriptions] Getting user subscriptions for user:', user.id);
      
      // Get from user_subscriptions table ONLY - only include active subscriptions
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          creator:creators(id, display_name, profile_image_url),
          tier:membership_tiers(id, title, description, price)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active') // Only active subscriptions
        .order('created_at', { ascending: false });

      return new Response(JSON.stringify({ subscriptions: subscriptions || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'get_creator_subscribers') {
      console.log('[SimpleSubscriptions] Getting creator subscribers for creator:', creatorId);
      
      // First, let's get all tiers for this creator to debug
      console.log('[SimpleSubscriptions] Fetching all tiers for creator:', creatorId);
      const { data: tiers } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorId);
      
      console.log('[SimpleSubscriptions] Found tiers for creator:', tiers?.map(t => ({ id: t.id, title: t.title, price: t.price, stripe_price_id: t.stripe_price_id })));
      
      if (!tiers || tiers.length === 0) {
        console.log('[SimpleSubscriptions] No tiers found for creator');
        return new Response(JSON.stringify({ subscribers: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Now let's check what's in Stripe for each tier
      console.log('[SimpleSubscriptions] Starting detailed Stripe sync for creator:', creatorId);
      
      for (const tier of tiers) {
        console.log('[SimpleSubscriptions] Processing tier:', tier.title, 'with stripe_price_id:', tier.stripe_price_id);
        
        if (!tier.stripe_price_id) {
          console.log('[SimpleSubscriptions] Tier has no stripe_price_id, skipping');
          continue;
        }
        
        try {
          // Get ALL subscriptions for this price from Stripe (not just active ones)
          console.log('[SimpleSubscriptions] Fetching ALL Stripe subscriptions for price:', tier.stripe_price_id);
          const stripeSubscriptions = await stripe.subscriptions.list({
            price: tier.stripe_price_id,
            status: 'all',
            limit: 100,
          });
          
          console.log('[SimpleSubscriptions] Found', stripeSubscriptions.data.length, 'total Stripe subscriptions for tier:', tier.title);
          
          // Log details of each subscription
          stripeSubscriptions.data.forEach((sub, index) => {
            console.log(`[SimpleSubscriptions] Subscription ${index + 1}:`, {
              id: sub.id,
              customer: sub.customer,
              status: sub.status,
              cancel_at_period_end: sub.cancel_at_period_end,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              metadata: sub.metadata
            });
          });
          
          // Filter for active subscriptions only
          const activeSubscriptions = stripeSubscriptions.data.filter(sub => sub.status === 'active');
          console.log('[SimpleSubscriptions] Active subscriptions for tier', tier.title + ':', activeSubscriptions.length);
          
          for (const stripeSub of activeSubscriptions) {
            console.log('[SimpleSubscriptions] Processing ACTIVE Stripe subscription:', stripeSub.id, 'status:', stripeSub.status);
            
            // Get customer details
            const customer = await stripe.customers.retrieve(stripeSub.customer as string);
            
            if (customer.deleted) {
              console.log('[SimpleSubscriptions] Customer deleted, skipping');
              continue;
            }
            
            console.log('[SimpleSubscriptions] Customer email:', customer.email);
            
            // Find user by email
            const { data: userData } = await supabase
              .from('users')
              .select('id')
              .eq('email', customer.email)
              .single();
            
            if (!userData) {
              console.log('[SimpleSubscriptions] No user found for email:', customer.email);
              continue;
            }
            
            console.log('[SimpleSubscriptions] Found user:', userData.id, 'for subscription:', stripeSub.id);
            
            // For active subscriptions, determine the correct status (removed cancelling)
            const dbStatus = 'active'; // Always active for active Stripe subscriptions
            
            console.log('[SimpleSubscriptions] Mapped status:', stripeSub.status, '->', dbStatus);
            
            // Upsert subscription in user_subscriptions table
            const subscriptionData = {
              user_id: userData.id,
              creator_id: creatorId, // CRITICAL: Use the creatorId parameter, not from metadata
              tier_id: tier.id,
              stripe_subscription_id: stripeSub.id,
              stripe_customer_id: stripeSub.customer,
              status: dbStatus,
              amount: tier.price,
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: stripeSub.cancel_at_period_end || false,
              updated_at: new Date().toISOString()
            };
            
            console.log('[SimpleSubscriptions] Upserting subscription data:', subscriptionData);
            
            const { error: upsertError } = await supabase
              .from('user_subscriptions')
              .upsert(subscriptionData, { 
                onConflict: 'user_id,creator_id,tier_id',
                ignoreDuplicates: false 
              });
            
            if (upsertError) {
              console.error('[SimpleSubscriptions] Error upserting subscription:', upsertError);
            } else {
              console.log('[SimpleSubscriptions] Successfully upserted subscription for user:', userData.id);
            }
          }
        } catch (error) {
          console.error('[SimpleSubscriptions] Error fetching Stripe subscriptions for tier:', tier.title, error);
        }
      }
      
      // CRITICAL FIX: Now get the synced data from user_subscriptions table - only filter by status = 'active'
      console.log('[SimpleSubscriptions] Fetching final results from user_subscriptions table');
      const { data: subscribers } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          user:users(id, username, email, profile_picture),
          tier:membership_tiers(id, title, price)
        `)
        .eq('creator_id', creatorId)
        .eq('status', 'active') // ONLY filter by active status - include all active subscriptions regardless of cancellation status
        .order('created_at', { ascending: false });

      console.log('[SimpleSubscriptions] Final subscribers count:', subscribers?.length || 0);
      
      // Log each subscriber for debugging
      if (subscribers && subscribers.length > 0) {
        subscribers.forEach((sub, index) => {
          console.log(`[SimpleSubscriptions] Final subscriber ${index + 1}:`, {
            user_email: sub.user?.email,
            tier_title: sub.tier?.title,
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            amount: sub.amount,
            stripe_subscription_id: sub.stripe_subscription_id
          });
        });
      }
      
      return new Response(JSON.stringify({ subscribers: subscribers || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('[SimpleSubscriptions] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
