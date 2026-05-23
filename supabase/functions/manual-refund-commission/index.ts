
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate FIRST — before parsing the body or initializing Stripe.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { commissionId, reason } = await req.json();
    console.log('Processing manual refund for commission:', { commissionId, reason });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });


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
      return jsonResponse({ error: 'Commission request not found' }, 404);
    }

    if (commissionRequest.creator.user_id !== user.id) {
      return jsonResponse({ error: 'Only the creator can issue refunds' }, 403);
    }

    const paymentIntentId = commissionRequest.stripe_payment_intent_id;

    if (!paymentIntentId) {
      return jsonResponse({ error: 'No payment found for this commission' }, 400);
    }

    if (!['accepted', 'in_progress', 'revision_requested', 'delivered'].includes(commissionRequest.status)) {
      return jsonResponse({ error: 'Commission is not in a refundable state' }, 400);
    }

    console.log('Creating refund for commission:', commissionId);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        commission_id: commissionId,
        refund_reason: reason || 'Manual refund by creator'
      }
    });

    const { error: updateError } = await supabaseService
      .from('commission_requests')
      .update({
        status: 'refunded',
        creator_notes: `Manual refund issued: ${reason || 'No reason provided'}`
      })
      .eq('id', commissionId);

    if (updateError) {
      console.error('Failed to update commission status:', updateError);
      return jsonResponse({ error: 'Refund processed but failed to update commission status' }, 500);
    }

    console.log('Manual refund processed successfully for commission:', commissionId);

    return jsonResponse({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status
      }
    }, 200);

  } catch (error) {
    console.error('Manual refund error:', error);
    return jsonResponse({ error: 'An unexpected error occurred' }, 500);
  }
});
