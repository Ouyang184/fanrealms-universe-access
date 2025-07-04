
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
    console.log('=== CREATE COMMISSION PAYMENT REQUEST ===');
    
    const { commissionId, customerId } = await req.json();
    console.log('Request data:', { commissionId, customerId });

    if (!commissionId) {
      console.error('Missing commission ID');
      throw new Error('Commission ID is required');
    }

    // Initialize Stripe with proper environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      throw new Error('Payment service configuration error');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase - use anon key first for user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Database service configuration error');
    }

    // Create client with anon key for user authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Authentication required');
    }

    console.log('User authenticated:', user.id);

    // Now use service role key for database operations to bypass RLS if needed
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

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
      .single();

    if (commissionError || !commissionRequest) {
      console.error('Commission request error:', commissionError);
      throw new Error('Commission request not found or not accessible');
    }

    console.log('Commission request found:', {
      id: commissionRequest.id,
      title: commissionRequest.title,
      agreed_price: commissionRequest.agreed_price,
      status: commissionRequest.status
    });

    // Check if request is in correct status for payment
    if (!['pending', 'checkout_created'].includes(commissionRequest.status)) {
      console.error('Commission request in wrong status:', commissionRequest.status);
      throw new Error(`Commission is in ${commissionRequest.status} status and cannot be paid`);
    }

    if (!commissionRequest.agreed_price) {
      console.error('No agreed price set');
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
      console.log('Found existing Stripe customer:', customerId_stripe);
    } else {
      console.log('No existing Stripe customer found, will create one in checkout');
    }

    // Get origin for redirect URLs
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');
    if (!origin) {
      console.error('No origin header found');
      throw new Error('Invalid request origin');
    }

    console.log('Creating Stripe checkout session with origin:', origin);

    // Create Stripe checkout session for standard one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId_stripe,
      customer_email: customerId_stripe ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Commission: ${commissionRequest.title}`,
              description: `${commissionRequest.commission_type.name} commission by ${commissionRequest.creator.display_name}`,
            },
            unit_amount: Math.round(commissionRequest.agreed_price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // Standard one-time payment
      success_url: `${origin}/commissions/${commissionId}/payment-success`,
      cancel_url: `${origin}/commissions/${commissionId}/pay`,
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      metadata: {
        commission_request_id: commissionId,
        customer_id: user.id,
        creator_id: commissionRequest.creator_id,
        type: 'commission_payment'
      }
    });

    console.log('Created Stripe checkout session:', session.id);

    // Update commission request with checkout session ID and checkout_created status
    const { error: updateError } = await supabaseService
      .from('commission_requests')
      .update({ 
        stripe_payment_intent_id: session.id,
        status: 'checkout_created',
        creator_notes: 'Checkout session created - awaiting customer payment'
      })
      .eq('id', commissionId);

    if (updateError) {
      console.error('Failed to update commission request:', updateError);
      // Cancel the checkout session if database update fails
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch (expireError) {
        console.error('Failed to expire checkout session:', expireError);
      }
      throw new Error('Failed to create commission payment');
    }

    console.log('Updated commission request status to checkout_created');
    console.log('=== SUCCESS: Returning checkout URL ===');

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== ERROR IN CREATE COMMISSION PAYMENT ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: 'Check function logs for more information'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
