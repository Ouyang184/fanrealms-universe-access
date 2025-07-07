
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
    const { commissionId, reason } = await req.json();
    
    console.log('Processing manual refund for commission:', { commissionId, reason });

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
      throw new Error('Unauthorized: Only the creator can issue refunds');
    }

    const paymentIntentId = commissionRequest.stripe_payment_intent_id;
    
    if (!paymentIntentId) {
      throw new Error('No payment intent found for this commission');
    }

    // Check if commission is in a refundable state
    if (!['accepted', 'in_progress'].includes(commissionRequest.status)) {
      throw new Error('Commission is not in a refundable state');
    }

    console.log('Creating refund for payment intent:', paymentIntentId);
    
    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        commission_id: commissionId,
        refund_reason: reason || 'Manual refund by creator'
      }
    });

    // Update commission status
    const { error: updateError } = await supabaseService
      .from('commission_requests')
      .update({ 
        status: 'refunded',
        creator_notes: `Manual refund issued: ${reason || 'No reason provided'}`
      })
      .eq('id', commissionId);

    if (updateError) {
      console.error('Failed to update commission status:', updateError);
      throw new Error('Refund processed but failed to update commission status');
    }

    console.log('Manual refund processed successfully:', refund.id);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Manual refund error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
