
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
    console.log('=== DELETE COMMISSION REQUEST ===');
    
    const { commissionId } = await req.json();
    console.log('Request to delete commission:', commissionId);

    if (!commissionId) {
      throw new Error('Commission ID is required');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Database service configuration error');
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Authentication required');
    }

    console.log('User authenticated:', user.id);

    // Fetch commission request to check ownership and get Stripe session info
    const { data: commissionRequest, error: fetchError } = await supabaseService
      .from('commission_requests')
      .select('id, customer_id, status, stripe_payment_intent_id')
      .eq('id', commissionId)
      .eq('customer_id', user.id)
      .single();

    if (fetchError || !commissionRequest) {
      console.error('Commission request error:', fetchError);
      throw new Error('Commission request not found or not accessible');
    }

    console.log('Commission request found:', {
      id: commissionRequest.id,
      status: commissionRequest.status,
      hasStripeSession: !!commissionRequest.stripe_payment_intent_id
    });

    // Check if the request can be deleted
    const deletableStatuses = ['pending', 'rejected', 'payment_pending', 'checkout_created'];
    if (!deletableStatuses.includes(commissionRequest.status)) {
      throw new Error(`Cannot delete commission with status: ${commissionRequest.status}`);
    }

    // Cancel Stripe session if it exists and status indicates active session
    if (commissionRequest.stripe_payment_intent_id && 
        ['checkout_created', 'payment_pending'].includes(commissionRequest.status)) {
      
      console.log('Cancelling Stripe session:', commissionRequest.stripe_payment_intent_id);
      
      const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeSecretKey) {
        console.error('STRIPE_SECRET_KEY not found in environment');
        throw new Error('Payment service configuration error');
      }

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      try {
        // Try to expire the checkout session
        await stripe.checkout.sessions.expire(commissionRequest.stripe_payment_intent_id);
        console.log('Successfully expired Stripe checkout session');
      } catch (stripeError) {
        console.error('Error expiring Stripe session:', stripeError);
        // Don't fail the deletion if session cancellation fails - session might already be expired
        console.log('Continuing with deletion despite Stripe session error');
      }
    }

    // Delete the commission request
    const { error: deleteError } = await supabaseService
      .from('commission_requests')
      .delete()
      .eq('id', commissionId)
      .eq('customer_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw new Error('Failed to delete commission request');
    }

    console.log('Successfully deleted commission request:', commissionId);
    console.log('=== SUCCESS ===');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Commission request deleted successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== ERROR IN DELETE COMMISSION REQUEST ===');
    console.error('Error details:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
