
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe with LIVE keys for subscription webhooks
const stripe = new (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_LIVE') || '',
  {
    apiVersion: '2023-10-16',
    httpClient: (await import('https://esm.sh/stripe@14.21.0')).default.createFetchHttpClient(),
  }
);

import { handleSubscriptionWebhook } from './handlers/subscription-webhook.ts';
import { handleCheckoutWebhook } from './handlers/checkout-webhook.ts';
import { handleProductWebhook } from './handlers/product-webhook.ts';
import { handlePaymentIntentWebhook } from './handlers/payment-intent-webhook.ts';
import { handlePriceWebhook } from './handlers/price-webhook.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SUBSCRIPTION WEBHOOK EVENT RECEIVED (LIVE MODE) ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Subscription webhook verified with LIVE secret');
    } catch (error) {
      console.error('Subscription webhook signature verification failed:', error);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Subscription webhook event type:', event.type, 'ID:', event.id);

    // Handle payment intent webhooks for custom payment flow
    if (event.type === 'payment_intent.succeeded') {
      console.log('Processing payment_intent.succeeded (SUBSCRIPTION - LIVE MODE)');
      await handlePaymentIntentWebhook(event, supabase, stripe);
    }

    // Handle price webhooks
    if (event.type.startsWith('price.')) {
      console.log('Processing price webhook:', event.type, '(SUBSCRIPTION - LIVE MODE)');
      await handlePriceWebhook(event, supabase);
    }

    // Handle product webhooks
    if (event.type.startsWith('product.')) {
      console.log('Processing product webhook:', event.type, '(SUBSCRIPTION - LIVE MODE)');
      await handleProductWebhook(event, supabase);
    }

    // Handle checkout session completed events
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed (SUBSCRIPTION - LIVE MODE)');
      await handleCheckoutWebhook(event, supabase, stripe);
    }

    // Handle subscription-related webhooks
    if (event.type.startsWith('customer.subscription.') || event.type === 'invoice.payment_succeeded') {
      console.log('Processing subscription webhook:', event.type, '(SUBSCRIPTION - LIVE MODE)');
      await handleSubscriptionWebhook(event, supabase, stripe);
    }

    // Handle invoice payment for earnings
    if (event.type === 'invoice.payment_succeeded') {
      console.log('=== PROCESSING INVOICE PAYMENT SUCCEEDED FOR EARNINGS (SUBSCRIPTION - LIVE MODE) ===');
      
      const invoice = event.data.object as any;
      console.log('Processing invoice payment succeeded:', invoice.id, '(SUBSCRIPTION - LIVE MODE)');

      let subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        const amountPaid = invoice.amount_paid / 100;
        const platformFee = amountPaid * 0.05;
        const creatorEarnings = amountPaid - platformFee;
        
        console.log('Payment details (SUBSCRIPTION - LIVE MODE):', { amountPaid, platformFee, creatorEarnings });

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
          console.error('Error recording creator earnings (SUBSCRIPTION - LIVE MODE):', earningsError);
        }
      }
    }

    console.log('=== SUBSCRIPTION WEBHOOK PROCESSING COMPLETE ===');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Subscription webhook error:', error);
    return new Response('Subscription webhook error', { status: 500, headers: corsHeaders });
  }
});
