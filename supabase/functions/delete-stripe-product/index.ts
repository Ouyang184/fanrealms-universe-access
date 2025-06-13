
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

    // Simply delete the product - Stripe should handle the cascading deletion
    try {
      console.log('Deleting Stripe product:', productId);
      const deletedProduct = await stripe.products.del(productId);
      console.log('Product deleted successfully:', deletedProduct);
    } catch (productError) {
      console.error('Error deleting product:', productError);
      throw new Error(`Failed to delete Stripe product: ${productError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Product deleted successfully',
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
