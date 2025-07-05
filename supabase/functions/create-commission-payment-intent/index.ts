import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('=== CREATE COMMISSION PAYMENT INTENT START (TEST MODE) ===');
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid request body');
    }

    const { commissionId, amount } = requestBody;
    console.log('Request data:', { commissionId, amount });

    if (!commissionId) {
      console.error('Missing commission ID');
      throw new Error('Commission ID is required');
    }

    // Initialize Stripe with TEST secret key for commissions
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_TEST');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY_TEST not found in environment');
      throw new Error('Payment service configuration error - test mode not configured');
    }

    console.log('Initializing Stripe TEST mode for commission payments');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: !!supabaseServiceKey
      });
      throw new Error('Database service configuration error');
    }

    console.log('Supabase environment variables found');

    // Create client with anon key for user authentication
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Authorization header is required');
    }

    console.log('Authorization header found, authenticating user...');
    const token = authHeader.replace('Bearer ', '');
    
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError) {
        console.error('Authentication failed:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }
      
      if (!authUser) {
        console.error('No user returned from authentication');
        throw new Error('Authentication required - no user found');
      }
      
      user = authUser;
      console.log('User authenticated successfully:', user.id);
    } catch (authError) {
      console.error('Error during authentication:', authError);
      throw new Error(`Authentication error: ${authError.message || 'Unknown auth error'}`);
    }

    // Now use service role key for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Service client created for database operations');

    // Fetch commission request details
    console.log('Fetching commission request details for ID:', commissionId);
    let commissionRequest;
    try {
      const { data, error: commissionError } = await supabaseService
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

      if (commissionError) {
        console.error('Commission request query error:', commissionError);
        throw new Error(`Database query failed: ${commissionError.message}`);
      }

      if (!data) {
        console.error('No commission request found for ID:', commissionId, 'and user:', user.id);
        throw new Error('Commission request not found or not accessible');
      }

      commissionRequest = data;
      console.log('Commission request found:', {
        id: commissionRequest.id,
        title: commissionRequest.title,
        agreed_price: commissionRequest.agreed_price,
        status: commissionRequest.status,
        stripe_payment_intent_id: commissionRequest.stripe_payment_intent_id
      });
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      throw new Error(`Database error: ${dbError.message || 'Unknown database error'}`);
    }

    // Check if request is in correct status for payment - now allowing payment_pending for retries
    if (!['pending', 'checkout_created', 'payment_pending', 'payment_failed'].includes(commissionRequest.status)) {
      console.error('Commission request in wrong status:', commissionRequest.status);
      throw new Error(`Commission is in ${commissionRequest.status} status and cannot be paid`);
    }

    if (!commissionRequest.agreed_price) {
      console.error('No agreed price set');
      throw new Error('No agreed price set for this commission');
    }

    console.log('Commission validation passed, proceeding with Stripe operations');

    // Handle existing payment intent if present
    let existingPaymentIntent = null;
    if (commissionRequest.stripe_payment_intent_id) {
      try {
        console.log('Checking existing payment intent:', commissionRequest.stripe_payment_intent_id);
        existingPaymentIntent = await stripe.paymentIntents.retrieve(commissionRequest.stripe_payment_intent_id);
        console.log('Existing payment intent status:', existingPaymentIntent.status);
        
        // If existing payment intent is still usable, return it
        if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existingPaymentIntent.status)) {
          console.log('Reusing existing payment intent (TEST MODE)');
          return new Response(JSON.stringify({ 
            client_secret: existingPaymentIntent.client_secret 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        
        // If payment intent failed or was canceled, we'll create a new one
        if (['canceled', 'payment_failed'].includes(existingPaymentIntent.status)) {
          console.log('Previous payment intent failed, creating new one (TEST MODE)');
        }
      } catch (stripeError) {
        console.log('Could not retrieve existing payment intent, creating new one (TEST MODE):', stripeError.message);
      }
    }

    // Check if customer already exists in Stripe (TEST mode)
    let customerId_stripe;
    try {
      const customers = await stripe.customers.list({ 
        email: user.email,
        limit: 1 
      });

      if (customers.data.length > 0) {
        customerId_stripe = customers.data[0].id;
        console.log('Found existing Stripe customer (TEST MODE):', customerId_stripe);
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id
          }
        });
        customerId_stripe = customer.id;
        console.log('Created new Stripe customer (TEST MODE):', customerId_stripe);
      }
    } catch (stripeError) {
      console.error('Stripe customer operation failed (TEST MODE):', stripeError);
      throw new Error(`Stripe customer error: ${stripeError.message || 'Unknown Stripe error'}`);
    }

    console.log('Creating new payment intent (TEST MODE)');

    // Create payment intent with capture_method: 'manual' for authorization hold
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
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

      console.log('Created payment intent (TEST MODE):', paymentIntent.id);
    } catch (stripeError) {
      console.error('Payment intent creation failed (TEST MODE):', stripeError);
      throw new Error(`Payment intent error: ${stripeError.message || 'Unknown payment intent error'}`);
    }

    // Update commission request with payment intent ID and payment_pending status
    try {
      const { error: updateError } = await supabaseService
        .from('commission_requests')
        .update({ 
          stripe_payment_intent_id: paymentIntent.id,
          status: 'payment_pending',
          creator_notes: 'Payment authorized - funds held pending creator approval (TEST MODE)'
        })
        .eq('id', commissionId);

      if (updateError) {
        console.error('Failed to update commission request:', updateError);
        // Cancel the payment intent if database update fails
        try {
          await stripe.paymentIntents.cancel(paymentIntent.id);
          console.log('Payment intent cancelled due to database update failure (TEST MODE)');
        } catch (cancelError) {
          console.error('Failed to cancel payment intent (TEST MODE):', cancelError);
        }
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      console.log('Updated commission request status to payment_pending (TEST MODE)');
    } catch (updateError) {
      console.error('Commission request update failed (TEST MODE):', updateError);
      throw new Error(`Update error: ${updateError.message || 'Unknown update error'}`);
    }

    console.log('=== SUCCESS: Returning client secret (TEST MODE) ===');

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== ERROR IN CREATE COMMISSION PAYMENT INTENT (TEST MODE) ===');
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
