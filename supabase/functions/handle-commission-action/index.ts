
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
    const { commissionId, action } = await req.json();
    
    console.log('Handling commission action (TEST MODE):', { commissionId, action });

    // Initialize Stripe with TEST key for commissions
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY_TEST');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY_TEST not found in environment');
      throw new Error('Payment service configuration error - test mode not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
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

    // Fetch commission request with creator check
    const { data: commissionRequest, error: fetchError } = await supabaseService
      .from('commission_requests')
      .select(`
        *,
        creator:creators!commission_requests_creator_id_fkey(
          display_name,
          user_id
        )
      `)
      .eq('id', commissionId)
      .single();

    if (fetchError || !commissionRequest) {
      throw new Error('Commission request not found');
    }

    // Verify user is the creator
    if (commissionRequest.creator.user_id !== user.id) {
      throw new Error('Unauthorized: Only the creator can perform this action');
    }

    const paymentIntentId = commissionRequest.stripe_payment_intent_id;
    
    if (!paymentIntentId) {
      throw new Error('No payment intent found for this commission');
    }

    if (action === 'accept') {
      console.log('Accepting commission and capturing payment (TEST MODE):', paymentIntentId);
      
      // For checkout sessions, we need to retrieve the payment intent
      try {
        // Try to get as checkout session first
        const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
        if (session.payment_intent) {
          // Capture the payment intent from the session
          const paymentIntent = await stripe.paymentIntents.capture(session.payment_intent as string);
          console.log('Payment captured successfully (TEST MODE):', paymentIntent.id);
        } else {
          throw new Error('No payment intent found in checkout session');
        }
      } catch (sessionError) {
        // If it's not a session, try as payment intent directly
        console.log('Attempting direct payment intent capture (TEST MODE)');
        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        console.log('Payment captured successfully (TEST MODE):', paymentIntent.id);
      }
      
      // Update commission status to accepted and paid
      const { error: updateError } = await supabaseService
        .from('commission_requests')
        .update({ 
          status: 'accepted',
          creator_notes: 'Commission accepted and payment captured (TEST MODE)'
        })
        .eq('id', commissionId);

      if (updateError) {
        console.error('Failed to update commission status:', updateError);
        throw new Error('Failed to update commission status');
      }

      console.log('Commission accepted and payment captured successfully (TEST MODE)');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Commission accepted and payment captured (TEST MODE)',
        paymentIntentId: paymentIntentId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (action === 'reject') {
      console.log('Rejecting commission and canceling payment (TEST MODE):', paymentIntentId);
      
      try {
        // Try to expire the checkout session
        const session = await stripe.checkout.sessions.expire(paymentIntentId);
        console.log('Checkout session expired (TEST MODE):', session.id);
      } catch (sessionError) {
        // If it's not a session, try as payment intent
        console.log('Attempting to cancel payment intent (TEST MODE)');
        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
        console.log('Payment intent canceled (TEST MODE):', paymentIntent.id);
      }
      
      // Update commission status to rejected
      const { error: updateError } = await supabaseService
        .from('commission_requests')
        .update({ 
          status: 'rejected',
          creator_notes: 'Commission rejected and payment canceled (TEST MODE)'
        })
        .eq('id', commissionId);

      if (updateError) {
        console.error('Failed to update commission status:', updateError);
        throw new Error('Failed to update commission status');
      }

      console.log('Commission rejected and payment canceled successfully (TEST MODE)');
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Commission rejected and payment canceled (TEST MODE)',
        paymentIntentId: paymentIntentId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else {
      throw new Error('Invalid action. Must be "accept" or "reject"');
    }

  } catch (error) {
    console.error('Commission action error (TEST MODE):', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
