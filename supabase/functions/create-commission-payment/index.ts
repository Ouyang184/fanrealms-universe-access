
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commissionId, customerId } = await req.json();
    
    console.log('Creating commission payment session for:', { commissionId, customerId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Fetch commission request details
    const { data: commissionRequest, error: commissionError } = await supabaseService
      .from('commission_requests')
      .select(`
        *,
        commission_type:commission_types(name, description),
        creator:creators!commission_requests_creator_id_fkey(
          display_name,
          user_id
        )
      `)
      .eq('id', commissionId)
      .eq('customer_id', user.id)
      .eq('status', 'accepted')
      .single();

    if (commissionError || !commissionRequest) {
      throw new Error('Commission request not found or not accessible');
    }

    if (!commissionRequest.agreed_price) {
      throw new Error('No agreed price set for this commission');
    }

    // Check if customer already exists in Stripe
    const customers = await stripe.customers.list({ 
      email: user.email,
      limit: 1 
    });

    let customerId_stripe;
    if (customers.data.length > 0) {
      customerId_stripe = customers.data[0].id;
    }

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId_stripe,
      customer_email: customerId_stripe ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Commission: ${commissionRequest.title}`,
              description: `${commissionRequest.commission_type.name} by ${commissionRequest.creator.display_name}`,
            },
            unit_amount: Math.round(commissionRequest.agreed_price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment mode
      success_url: `${req.headers.get('origin')}/commissions/${commissionId}/payment-success`,
      cancel_url: `${req.headers.get('origin')}/commissions/${commissionId}/pay`,
      metadata: {
        commission_id: commissionId,
        customer_id: user.id,
        creator_id: commissionRequest.creator_id,
        type: 'commission_payment'
      },
    });

    console.log('Created Stripe session:', session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Commission payment error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
