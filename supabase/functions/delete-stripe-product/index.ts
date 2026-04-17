
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { productId } = await req.json();
    if (!productId || typeof productId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Ownership verification: ensure this product belongs to a tier owned by the caller
    const { data: tier, error: tierError } = await supabaseService
      .from('membership_tiers')
      .select('id, creator_id')
      .eq('stripe_product_id', productId)
      .maybeSingle();

    if (tierError || !tier) {
      console.error('Ownership lookup failed (tier not found)');
      return new Response(
        JSON.stringify({ error: 'Forbidden', success: false }),
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
        JSON.stringify({ error: 'Forbidden', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    try {
      await stripe.products.del(productId);
    } catch (productError) {
      console.error('Stripe delete product error:', productError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete product', success: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, productId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Delete product error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
