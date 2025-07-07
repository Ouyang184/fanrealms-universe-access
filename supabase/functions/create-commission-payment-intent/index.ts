
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
    console.log('=== CREATE COMMISSION PAYMENT INTENT (AUTHORIZATION MODE) ===');
    
    const { commissionId, amount } = await req.json();
    console.log('Request data:', { commissionId, amount });

    if (!commissionId) {
      console.error('Missing commission ID');
      throw new Error('Commission ID is required');
    }

    // Initialize Stripe with TEST key for commissions
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_TEST');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY_TEST not found in environment');
      throw new Error('Payment service configuration error - test mode not configured');
    }

    console.log('Using Stripe TEST mode for commission payments (AUTHORIZATION MODE)');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
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

    // Now use service role key for database operations
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

    // Check if customer already exists in Stripe (TEST mode)
    const customers = await stripe.customers.list({ 
      email: user.email,
      limit: 1 
    });

    let customerId_stripe;
    if (customers.data.length > 0) {
      customerId_stripe = customers.data[0].id;
      console.log('Found existing Stripe customer (TEST):', customerId_stripe);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          environment: 'test'
        }
      });
      customerId_stripe = customer.id;
      console.log('Created new Stripe customer (TEST):', customerId_stripe);
    }

    console.log('Creating payment intent (AUTHORIZATION MODE - TEST)');

    // Create payment intent with capture_method: 'manual' for authorization hold
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(commissionRequest.agreed_price * 100),
      currency: 'usd',
      customer: customerId_stripe,
      capture_method: 'manual', // This is key - authorizes but doesn't capture
      description: `Commission: ${commissionRequest.title}`,
      metadata: {
        commission_request_id: commissionId,
        customer_id: user.id,
        creator_id: commissionRequest.creator_id,
        type: 'commission_payment',
        environment: 'test'
      }
    });

    console.log('Created payment intent (AUTHORIZATION MODE - TEST):', paymentIntent.id);

    // Update commission request with payment intent ID and payment_pending status
    const { error: updateError } = await supabaseService
      .from('commission_requests')
      .update({ 
        stripe_payment_intent_id: paymentIntent.id,
        status: 'payment_pending',
        creator_notes: 'Payment authorized (TEST MODE) - funds held pending creator approval'
      })
      .eq('id', commissionId);

    if (updateError) {
      console.error('Failed to update commission request:', updateError);
      // Cancel the payment intent if database update fails
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      } catch (cancelError) {
        console.error('Failed to cancel payment intent:', cancelError);
      }
      throw new Error('Failed to create commission payment');
    }

    console.log('Updated commission request status to payment_pending (AUTHORIZATION MODE - TEST)');
    console.log('=== SUCCESS: Returning client secret (AUTHORIZATION MODE - TEST) ===');

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== ERROR IN CREATE COMMISSION PAYMENT INTENT (AUTHORIZATION MODE - TEST) ===');
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
