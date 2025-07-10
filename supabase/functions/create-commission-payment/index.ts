
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
    console.log('Create commission payment function started');
    
    const { commissionId } = await req.json();
    
    if (!commissionId) {
      return new Response(JSON.stringify({ 
        error: 'Commission ID is required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ 
        error: 'Stripe configuration missing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ 
        error: 'Supabase configuration missing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication failed' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Fetch commission request
    const { data: commissionRequest, error: fetchError } = await supabaseService
      .from('commission_requests')
      .select(`
        *,
        creator:creators!commission_requests_creator_id_fkey(
          display_name
        )
      `)
      .eq('id', commissionId)
      .single();

    if (fetchError || !commissionRequest) {
      return new Response(JSON.stringify({ 
        error: 'Commission request not found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Verify user is the customer
    if (commissionRequest.customer_id !== user.id) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Only the customer can pay for this commission' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    if (!commissionRequest.agreed_price) {
      return new Response(JSON.stringify({ 
        error: 'Commission price not set' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const totalAmount = Math.round(commissionRequest.agreed_price * 100); // Convert to cents
    const platformFee = Math.round(totalAmount * 0.05); // 5% platform fee
    
    console.log('Payment details:', { 
      totalAmount, 
      platformFee, 
      creatorNet: totalAmount - platformFee 
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Commission: ${commissionRequest.title}`,
              description: `Creator: ${commissionRequest.creator?.display_name || 'Unknown'}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual', // Authorize payment, capture later when creator accepts
        metadata: {
          commission_id: commissionId,
          platform_fee_cents: platformFee.toString(),
          creator_net_cents: (totalAmount - platformFee).toString(),
        },
      },
      success_url: `${req.headers.get('origin')}/commission-payment/${commissionId}/success`,
      cancel_url: `${req.headers.get('origin')}/commission-payment/${commissionId}`,
      metadata: {
        commission_id: commissionId,
        platform_fee_amount: (platformFee / 100).toString(),
      },
    });

    // Update commission request with session info and platform fee
    await supabaseService
      .from('commission_requests')
      .update({ 
        stripe_payment_intent_id: session.id,
        platform_fee_amount: platformFee / 100, // Store in dollars
        status: 'payment_pending'
      })
      .eq('id', commissionId);

    console.log('Checkout session created:', session.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      totalAmount: totalAmount / 100,
      platformFee: platformFee / 100,
      creatorNetAmount: (totalAmount - platformFee) / 100
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Commission payment creation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
