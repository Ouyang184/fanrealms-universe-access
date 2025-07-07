
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== CREATE COMMISSION PAYMENT SESSION START ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { commissionId } = requestBody;
    console.log('Commission ID:', commissionId);

    if (!commissionId) {
      console.error('Missing commission ID in request');
      return new Response(JSON.stringify({ 
        error: 'Commission ID is required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_TEST');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY_TEST not configured');
      return new Response(JSON.stringify({ 
        error: 'Stripe configuration missing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({ 
        error: 'Database configuration missing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Initialize Stripe with error handling
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      console.log('Stripe initialized successfully');
    } catch (stripeError) {
      console.error('Failed to initialize Stripe:', stripeError);
      return new Response(JSON.stringify({ 
        error: 'Payment system initialization failed',
        details: stripeError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Initialize Supabase with error handling
    let supabaseService;
    try {
      supabaseService = createClient(supabaseUrl, supabaseServiceKey);
      console.log('Supabase service client initialized');
    } catch (supabaseError) {
      console.error('Failed to initialize Supabase:', supabaseError);
      return new Response(JSON.stringify({ 
        error: 'Database initialization failed',
        details: supabaseError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Authenticate user with proper error handling
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ 
        error: 'Authorization header is required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    let user;
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabaseService.auth.getUser(token);
      
      if (authError) {
        console.error('Authentication error:', authError);
        throw authError;
      }
      
      if (!authUser) {
        console.error('No user found from token');
        throw new Error('User not found');
      }
      
      user = authUser;
      console.log('User authenticated successfully:', user.id);
    } catch (authError) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Fetch commission request with comprehensive error handling
    let commissionRequest;
    try {
      console.log('Fetching commission request for ID:', commissionId);
      
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
        .single();

      if (commissionError) {
        console.error('Database error fetching commission:', commissionError);
        throw commissionError;
      }

      if (!data) {
        console.error('Commission request not found for ID:', commissionId);
        throw new Error('Commission request not found');
      }

      commissionRequest = data;
      console.log('Commission request fetched successfully:', {
        id: commissionRequest.id,
        title: commissionRequest.title,
        status: commissionRequest.status,
        agreedPrice: commissionRequest.agreed_price
      });

    } catch (dbError) {
      console.error('Failed to fetch commission request:', dbError);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch commission request',
        details: dbError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Validate commission request status
    if (commissionRequest.status !== 'accepted') {
      console.error(`Invalid commission status: ${commissionRequest.status}`);
      return new Response(JSON.stringify({ 
        error: `Commission must be accepted before payment. Current status: ${commissionRequest.status}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!commissionRequest.agreed_price) {
      console.error('No agreed price set for commission');
      return new Response(JSON.stringify({ 
        error: 'No agreed price set for this commission' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Handle Stripe customer creation/retrieval with error handling
    let customerId;
    try {
      console.log('Checking for existing Stripe customer for email:', user.email);
      
      const customers = await stripe.customers.list({ 
        email: user.email,
        limit: 1 
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Found existing Stripe customer:', customerId);
      } else {
        console.log('Creating new Stripe customer');
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            user_id: user.id,
            environment: 'test'
          }
        });
        customerId = customer.id;
        console.log('Created new Stripe customer:', customerId);
      }
    } catch (stripeCustomerError) {
      console.error('Stripe customer operation failed:', stripeCustomerError);
      return new Response(JSON.stringify({ 
        error: 'Failed to setup customer for payment',
        details: stripeCustomerError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Create checkout session with comprehensive error handling
    let session;
    try {
      console.log('Creating Stripe checkout session');
      
      const originHeader = req.headers.get('origin') || req.headers.get('referer');
      console.log('Origin for redirect URLs:', originHeader);

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Commission: ${commissionRequest.title}`,
                description: `${commissionRequest.commission_type?.name || 'Custom Commission'} by ${commissionRequest.creator?.display_name || 'Creator'}`,
              },
              unit_amount: Math.round(commissionRequest.agreed_price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${originHeader}/commission-payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${originHeader}/requests`,
        metadata: {
          commission_request_id: commissionId,
          customer_id: user.id,
          creator_id: commissionRequest.creator_id,
          type: 'commission_payment',
          environment: 'test'
        }
      });

      console.log('Checkout session created successfully:', session.id);

    } catch (stripeSessionError) {
      console.error('Failed to create Stripe checkout session:', stripeSessionError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create payment session',
        details: stripeSessionError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Update commission request with session ID
    try {
      console.log('Updating commission request with session ID');
      
      const { error: updateError } = await supabaseService
        .from('commission_requests')
        .update({ 
          stripe_payment_intent_id: session.id,
          creator_notes: 'Payment session created - customer can now complete payment'
        })
        .eq('id', commissionId);

      if (updateError) {
        console.error('Failed to update commission request:', updateError);
        throw updateError;
      }

      console.log('Commission request updated successfully');

    } catch (updateError) {
      console.error('Database update failed:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Failed to finalize commission payment setup',
        details: updateError.message 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('=== SUCCESS: Payment session created ===');
    
    return new Response(JSON.stringify({ 
      url: session.url 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== UNHANDLED ERROR IN CREATE COMMISSION PAYMENT ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred while creating payment session',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error.constructor.name || 'UnknownError'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
