
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { productId, priceId } = await req.json();
    if (!productId || typeof productId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Ownership verification
    const { data: tier, error: tierError } = await supabaseService
      .from('membership_tiers')
      .select('id, creator_id')
      .eq('stripe_product_id', productId)
      .maybeSingle();

    if (tierError || !tier) {
      console.error('Ownership lookup failed (tier not found)');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { data: creator, error: creatorError } = await supabaseService
      .from('creators')
      .select('id')
      .eq('id', tier.creator_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (creatorError || !creator) {
      console.error('Ownership lookup failed (creator mismatch)', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    const archivedProduct = await stripe.products.update(productId, { active: false });

    if (priceId && typeof priceId === 'string') {
      try {
        await stripe.prices.update(priceId, { active: false });
      } catch (priceError) {
        console.error('Error deactivating price (continuing anyway):', priceError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, archivedProductId: archivedProduct.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error archiving Stripe product:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to archive product' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
