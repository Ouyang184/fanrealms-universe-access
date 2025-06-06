
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
    console.log('=== ARCHIVE STRIPE PRODUCT FUNCTION START ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    // Initialize Supabase client for auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { productId, priceId } = await req.json();
    console.log('Archive request:', { productId, priceId });

    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Archive the Stripe product (this also archives associated prices)
    console.log('Archiving Stripe product:', productId);
    
    const archivedProduct = await stripe.products.update(productId, {
      active: false,
    });

    console.log('Product archived successfully:', archivedProduct.id);

    // If a specific price ID was provided, also deactivate it
    if (priceId) {
      try {
        console.log('Deactivating price:', priceId);
        await stripe.prices.update(priceId, {
          active: false,
        });
        console.log('Price deactivated successfully');
      } catch (priceError) {
        console.error('Error deactivating price (continuing anyway):', priceError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      archivedProductId: archivedProduct.id,
      message: 'Product archived successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error archiving Stripe product:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to archive Stripe product' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
