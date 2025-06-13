
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== DELETE STRIPE PRODUCT FUNCTION START ===');

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('User authenticated:', user.id);

    // Get request body
    const { productId } = await req.json();
    console.log('Delete request for product:', productId);

    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // First, get all prices for this product and deactivate them
    try {
      console.log('Fetching all prices for product:', productId);
      const prices = await stripe.prices.list({
        product: productId,
        limit: 100, // Get all prices for this product
      });

      console.log(`Found ${prices.data.length} prices to deactivate`);

      // Deactivate all prices associated with this product
      for (const price of prices.data) {
        try {
          if (price.active) {
            console.log('Deactivating price:', price.id);
            await stripe.prices.update(price.id, {
              active: false,
            });
            console.log('Price deactivated successfully:', price.id);
          }
        } catch (priceError) {
          console.log('Error deactivating price (continuing anyway):', priceError);
          // Continue even if individual price deactivation fails
        }
      }
    } catch (pricesError) {
      console.log('Error fetching/deactivating prices (continuing anyway):', pricesError);
      // Continue even if we can't deactivate prices
    }

    // Now delete the product completely
    try {
      console.log('Deleting Stripe product:', productId);
      await stripe.products.del(productId);
      console.log('Product deleted successfully:', productId);
    } catch (productError) {
      console.error('Error deleting product:', productError);
      throw new Error(`Failed to delete Stripe product: ${productError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product and all associated prices deactivated and product deleted successfully',
        productId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Delete product error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to delete product',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
