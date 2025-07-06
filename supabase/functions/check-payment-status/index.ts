
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
    console.log('=== CHECK PAYMENT STATUS ===');
    
    const { paymentIntentId, commissionId } = await req.json();
    console.log('Request data:', { paymentIntentId, commissionId });

    if (!paymentIntentId || !commissionId) {
      throw new Error('Payment Intent ID and Commission ID are required');
    }

    // Initialize Stripe with TEST key
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

    // Check the payment intent status with Stripe
    console.log('Retrieving payment intent from Stripe:', paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment intent status:', paymentIntent.status);

    // Determine the commission status based on payment intent status
    let newStatus: string;
    let creatorNotes: string;

    switch (paymentIntent.status) {
      case 'succeeded':
        newStatus = 'payment_authorized';
        creatorNotes = 'Payment authorized successfully - funds held pending your approval (TEST MODE)';
        break;
      case 'requires_payment_method':
      case 'requires_confirmation':
        newStatus = 'payment_pending';
        creatorNotes = 'Payment in progress - customer completing payment (TEST MODE)';
        break;
      case 'canceled':
        newStatus = 'rejected';
        creatorNotes = 'Payment canceled (TEST MODE)';
        break;
      case 'payment_failed':
        newStatus = 'payment_failed';
        creatorNotes = 'Payment failed - customer needs to try again (TEST MODE)';
        break;
      default:
        newStatus = 'payment_pending';
        creatorNotes = `Payment status: ${paymentIntent.status} (TEST MODE)`;
    }

    // Update the commission request status
    console.log('Updating commission status to:', newStatus);
    const { error: updateError } = await supabaseService
      .from('commission_requests')
      .update({ 
        status: newStatus,
        creator_notes: creatorNotes
      })
      .eq('id', commissionId);

    if (updateError) {
      console.error('Failed to update commission status:', updateError);
      throw new Error('Failed to update commission status');
    }

    console.log('Successfully updated commission status');

    return new Response(JSON.stringify({ 
      success: true,
      status: newStatus,
      paymentStatus: paymentIntent.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
