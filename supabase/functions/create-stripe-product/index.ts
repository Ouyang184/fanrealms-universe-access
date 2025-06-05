
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== CREATE STRIPE PRODUCT FUNCTION START ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    // Initialize Supabase client for auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Initialize Supabase service client for database writes
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('User authenticated:', user.id);

    // Get request body
    const { tierData, tierId } = await req.json();
    console.log('Request data:', { tierData, tierId });

    // Get creator ID for this user
    const { data: creatorData, error: creatorError } = await supabaseService
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creatorData) {
      throw new Error('Creator profile not found');
    }

    console.log('Creator found:', creatorData.id);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    let stripeProductId = null;
    let stripePriceId = null;

    // Create or update Stripe product
    if (tierId) {
      // Editing existing tier - check if it has a Stripe product
      const { data: existingTier } = await supabaseService
        .from('membership_tiers')
        .select('stripe_product_id, stripe_price_id')
        .eq('id', tierId)
        .single();

      if (existingTier?.stripe_product_id) {
        // Update existing Stripe product
        console.log('Updating existing Stripe product:', existingTier.stripe_product_id);
        
        const updatedProduct = await stripe.products.update(existingTier.stripe_product_id, {
          name: tierData.name,
          description: tierData.features.join(' | '),
          metadata: {
            creator_id: creatorData.id,
            tier_id: tierId
          }
        });
        
        stripeProductId = updatedProduct.id;

        // Create new price for updated tier (prices are immutable in Stripe)
        const newPrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(tierData.price * 100), // Convert to cents
          currency: 'usd',
          recurring: {
            interval: 'month'
          },
          metadata: {
            creator_id: creatorData.id,
            tier_id: tierId
          }
        });

        stripePriceId = newPrice.id;

        // Update product default price
        await stripe.products.update(stripeProductId, {
          default_price: stripePriceId
        });

        console.log('Updated Stripe product and created new price:', { stripeProductId, stripePriceId });
      } else {
        // Create new Stripe product for existing tier
        const product = await stripe.products.create({
          name: tierData.name,
          description: tierData.features.join(' | '),
          metadata: {
            creator_id: creatorData.id,
            tier_id: tierId
          }
        });

        stripeProductId = product.id;

        // Create price
        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(tierData.price * 100),
          currency: 'usd',
          recurring: {
            interval: 'month'
          },
          metadata: {
            creator_id: creatorData.id,
            tier_id: tierId
          }
        });

        stripePriceId = price.id;

        console.log('Created new Stripe product and price for existing tier:', { stripeProductId, stripePriceId });
      }
    } else {
      // Creating new tier
      const product = await stripe.products.create({
        name: tierData.name,
        description: tierData.features.join(' | '),
        metadata: {
          creator_id: creatorData.id
        }
      });

      stripeProductId = product.id;

      // Create price
      const price = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(tierData.price * 100),
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          creator_id: creatorData.id
        }
      });

      stripePriceId = price.id;

      console.log('Created new Stripe product and price:', { stripeProductId, stripePriceId });
    }

    return new Response(JSON.stringify({
      success: true,
      stripeProductId,
      stripePriceId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating/updating Stripe product:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create/update Stripe product' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
