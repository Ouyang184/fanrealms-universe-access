import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const purchaseId = String(body?.purchaseId ?? '');
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 500) : '';
    if (!purchaseId) return json({ error: 'purchaseId is required' }, 400);

    const { data: purchase, error: fetchError } = await supabase
      .from('purchases')
      .select('id, status, stripe_payment_intent_id, creator_id, creators:creator_id(user_id)')
      .eq('id', purchaseId)
      .maybeSingle();

    if (fetchError || !purchase) return json({ error: 'Purchase not found' }, 404);
    if ((purchase as any).creators?.user_id !== user.id) {
      return json({ error: 'Only the seller can issue refunds' }, 403);
    }
    if (purchase.status !== 'completed') {
      return json({ error: 'Purchase is not refundable' }, 400);
    }
    if (!purchase.stripe_payment_intent_id) {
      return json({ error: 'No Stripe payment intent on file' }, 400);
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const refund = await stripe.refunds.create({
      payment_intent: purchase.stripe_payment_intent_id,
      reason: 'requested_by_customer',
      metadata: { purchase_id: purchaseId, refund_reason: reason || 'Seller refund' },
    });

    const { error: updateError } = await supabase
      .from('purchases')
      .update({ status: 'refunded' })
      .eq('id', purchaseId);

    if (updateError) {
      console.error('Failed to update purchase status:', updateError);
      return json({ error: 'Refund processed but failed to update record' }, 500);
    }

    return json({ success: true, refundId: refund.id }, 200);
  } catch (error: any) {
    console.error('refund-purchase error:', error);
    return json({ error: error?.message ?? 'Refund failed' }, 500);
  }
});
