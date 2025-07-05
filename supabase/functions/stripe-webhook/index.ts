
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe properly for Deno with async crypto provider - USING LIVE KEYS FOR MAIN SYSTEM
const stripe = new (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_LIVE') || '',
  {
    apiVersion: '2023-10-16',
    httpClient: (await import('https://esm.sh/stripe@14.21.0')).default.createFetchHttpClient(),
  }
);

// Initialize TEST Stripe for commission webhooks
const stripeTest = new (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_TEST') || '',
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
import { handleCommissionWebhook } from './handlers/commission-webhook.ts';

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
    let isCommissionWebhook = false;
    
    try {
      // First try to verify with live webhook secret
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Webhook verified with LIVE secret');
    } catch (liveError) {
      // If live verification fails, it might be a test webhook for commissions
      try {
        const testWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST');
        if (testWebhookSecret) {
          event = await stripeTest.webhooks.constructEventAsync(body, signature, testWebhookSecret);
          isCommissionWebhook = true;
          console.log('Webhook verified with TEST secret (commission webhook)');
        } else {
          throw liveError;
        }
      } catch (testError) {
        console.error('Webhook signature verification failed for both live and test:', { liveError, testError });
        return new Response('Webhook signature verification failed', { status: 400 });
      }
    }

    console.log('Webhook event type:', event.type, 'ID:', event.id);

    // Handle commission-related webhooks (from test environment)
    if (isCommissionWebhook || event.data.object.metadata?.type === 'commission_payment') {
      console.log('Processing commission webhook:', event.type);
      await handleCommissionWebhook(event, supabase);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle regular webhooks (live environment)
    
    // Handle payment intent webhooks for custom payment flow
    if (event.type === 'payment_intent.succeeded') {
      console.log('Processing payment_intent.succeeded (LIVE MODE)');
      await handlePaymentIntentWebhook(event, supabase, stripe);
    }

    // Handle price webhooks
    if (event.type.startsWith('price.')) {
      console.log('Processing price webhook:', event.type, '(LIVE MODE)');
      await handlePriceWebhook(event, supabase);
    }

    // Handle product webhooks
    if (event.type.startsWith('product.')) {
      console.log('Processing product webhook:', event.type, '(LIVE MODE)');
      await handleProductWebhook(event, supabase);
    }

    // Handle checkout session completed events FIRST
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed (LIVE MODE)');
      await handleCheckoutWebhook(event, supabase, stripe);
    }

    // Handle subscription-related webhooks
    if (event.type.startsWith('customer.subscription.') || event.type === 'invoice.payment_succeeded') {
      console.log('Processing subscription webhook:', event.type, '(LIVE MODE)');
      await handleSubscriptionWebhook(event, supabase, stripe);
    }

    // Keep existing invoice payment handling for earnings
    if (event.type === 'invoice.payment_succeeded') {
      console.log('=== PROCESSING INVOICE PAYMENT SUCCEEDED FOR EARNINGS (LIVE MODE) ===');
      
      const invoice = event.data.object as any;
      console.log('Processing invoice payment succeeded:', invoice.id, '(LIVE MODE)');

      let subscriptionId = invoice.subscription;
      
      if (subscriptionId) {
        const amountPaid = invoice.amount_paid / 100;
        const platformFee = amountPaid * 0.05;
        const creatorEarnings = amountPaid - platformFee;
        
        console.log('Payment details (LIVE MODE):', { amountPaid, platformFee, creatorEarnings });

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
          console.error('Error recording creator earnings (LIVE MODE):', earningsError);
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
