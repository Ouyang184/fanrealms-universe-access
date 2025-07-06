
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
    console.log('=== CREATE COMMISSION PAYMENT SESSION ===');
    
    const { commissionId } = await req.json();
    console.log('Request data:', { commissionId });

    if (!commissionId) {
      throw new Error('Commission ID is required');
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_TEST');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    console.log('User authenticated:', user.id);

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
      .single();

    if (commissionError || !commissionRequest) {
      console.error('Commission request error:', commissionError);
      throw new Error('Commission request not found');
    }

    console.log('Commission request found:', {
      id: commissionRequest.id,
      title: commissionRequest.title,
      agreed_price: commissionRequest.agreed_price,
      status: commissionRequest.status,
      existing_stripe_id: commissionRequest.stripe_payment_intent_id
    });

    // Handle different commission statuses
    if (commissionRequest.status === 'completed') {
      // Check if this commission already has a payment
      if (commissionRequest.stripe_payment_intent_id) {
        throw new Error('This commission has already been completed and paid. Cannot create another payment session.');
      } else {
        // Reset status to accepted if no payment exists (data inconsistency)
        console.log('Commission marked as completed but no payment found. Resetting status to accepted.');
        const { error: resetError } = await supabaseService
          .from('commission_requests')
          .update({ 
            status: 'accepted',
            creator_notes: 'Status reset to accepted for payment processing'
          })
          .eq('id', commissionId);

        if (resetError) {
          console.error('Failed to reset commission status:', resetError);
          throw new Error('Failed to reset commission status for payment');
        }
      }
    } else if (commissionRequest.status === 'paid' || commissionRequest.status === 'in_progress') {
      throw new Error(`This commission is already ${commissionRequest.status}. Cannot create another payment session.`);
    } else if (commissionRequest.status !== 'accepted') {
      throw new Error(`Commission must be accepted before payment. Current status: ${commissionRequest.status}`);
    }

    if (!commissionRequest.agreed_price) {
      throw new Error('No agreed price set for this commission');
    }

    // Check if there's already an active checkout session
    if (commissionRequest.stripe_payment_intent_id && commissionRequest.stripe_payment_intent_id.startsWith('cs_')) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(commissionRequest.stripe_payment_intent_id);
        if (existingSession.status === 'open') {
          console.log('Returning existing active checkout session:', existingSession.id);
          return new Response(JSON.stringify({ 
            url: existingSession.url 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        } else if (existingSession.payment_status === 'paid') {
          throw new Error('This commission has already been paid. Please refresh the page to see the updated status.');
        }
      } catch (stripeError) {
        console.log('Previous session not found or expired, creating new one');
      }
    }

    // Check if customer already exists in Stripe
    const customers = await stripe.customers.list({ 
      email: user.email,
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Found existing Stripe customer:', customerId);
    } else {
      // Create new customer
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

    console.log('Creating new payment session');

    // Create checkout session for immediate payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Commission: ${commissionRequest.title}`,
              description: `${commissionRequest.commission_type.name} by ${commissionRequest.creator.display_name}`,
            },
            unit_amount: Math.round(commissionRequest.agreed_price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/commission-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/requests`,
      metadata: {
        commission_request_id: commissionId,
        customer_id: user.id,
        creator_id: commissionRequest.creator_id,
        type: 'commission_payment',
        environment: 'test'
      }
    });

    console.log('Created new payment session:', session.id);

    // Update commission request with new session ID and reset status if needed
    const { error: updateError } = await supabaseService
      .from('commission_requests')
      .update({ 
        stripe_payment_intent_id: session.id,
        status: 'accepted', // Ensure status is correct for payment
        creator_notes: 'New payment session created - customer can now complete payment'
      })
      .eq('id', commissionId);

    if (updateError) {
      console.error('Failed to update commission request:', updateError);
      throw new Error('Failed to create commission payment session');
    }

    console.log('Updated commission request with new session ID');
    console.log('=== SUCCESS ===');

    return new Response(JSON.stringify({ 
      url: session.url 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== ERROR IN CREATE COMMISSION PAYMENT ===');
    console.error('Error details:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
