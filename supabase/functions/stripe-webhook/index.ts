import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY') || ''
);

import { handleSubscriptionWebhook } from './handlers/subscription-webhook.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== WEBHOOK EVENT RECEIVED ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Webhook event type:', event.type, 'ID:', event.id);

    // Handle subscription-related webhooks
    if (event.type.startsWith('customer.subscription.') || event.type === 'invoice.payment_succeeded') {
      await handleSubscriptionWebhook(event, supabase);
    }

    // Keep existing invoice payment handling for earnings
    if (event.type === 'invoice.payment_succeeded') {
      console.log('=== PROCESSING INVOICE PAYMENT SUCCEEDED FOR EARNINGS ===');
      
      const invoice = event.data.object as any;
      console.log('Processing invoice payment succeeded:', invoice.id);

      let subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        const amountPaid = invoice.amount_paid / 100;
        const platformFee = amountPaid * 0.05;
        const creatorEarnings = amountPaid - platformFee;
        
        console.log('Payment details:', { amountPaid, platformFee, creatorEarnings });

        // Record the payment in creator_earnings
        const { error: earningsError } = await supabase
          .from('creator_earnings')
          .insert({
            creator_id: invoice.metadata?.creator_id,
            subscription_id: subscriptionId,
            amount: amountPaid,
            platform_fee: platformFee,
            net_amount: creatorEarnings,
            payment_date: new Date().toISOString()
          });

        if (earningsError) {
          console.error('Error recording creator earnings:', earningsError);
        }
      }
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500, headers: corsHeaders });
  }
});
