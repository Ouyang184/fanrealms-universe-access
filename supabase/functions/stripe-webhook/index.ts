
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe properly for Deno with async crypto provider - USING LIVE KEYS
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
import { handleCommissionWebhook } from './handlers/commission-webhook.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== WEBHOOK EVENT RECEIVED (LIVE MODE) ===');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasWebhookSecret: !!webhookSecret,
      webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'NOT_SET'
    });

    if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
      console.error('Missing required environment variables:', {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
        STRIPE_WEBHOOK_SECRET: !!webhookSecret
      });
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    console.log('Webhook data:', {
      bodyLength: body.length,
      hasSignature: !!signature,
      signaturePrefix: signature ? signature.substring(0, 20) + '...' : 'NO_SIGNATURE'
    });

    if (!signature) {
      console.error('No stripe-signature header found');
      return new Response('Missing stripe-signature header', { status: 400, headers: corsHeaders });
    }

    let event;
    try {
      // Use async webhook construction for Deno compatibility
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Webhook signature verified successfully (LIVE MODE)');
    } catch (err) {
      console.error('===== WEBHOOK SIGNATURE VERIFICATION FAILED =====');
      console.error('Error details:', err);
      console.error('Error message:', err.message);
      console.error('Error type:', err.type);
      console.error('Webhook secret used:', webhookSecret ? 'SET (length: ' + webhookSecret.length + ')' : 'NOT_SET');
      console.error('Signature received:', signature);
      console.error('Body preview:', body.substring(0, 200) + '...');
      return new Response(JSON.stringify({ 
        error: 'Webhook signature verification failed',
        details: err.message 
      }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('Webhook event type:', event.type, 'ID:', event.id, '(LIVE MODE)');

    // Handle commission-related webhooks
    if (event.type === 'payment_intent.canceled' || 
        event.type === 'payment_intent.succeeded' || 
        event.type === 'charge.refunded') {
      console.log('Processing commission webhook:', event.type, '(LIVE MODE)');
      await handleCommissionWebhook(event, supabase);
    }

    // Handle payment intent webhooks for custom payment flow
    if (event.type === 'payment_intent.succeeded') {
      console.log('===== PAYMENT INTENT SUCCEEDED WEBHOOK RECEIVED =====');
      console.log('Event ID:', event.id);
      console.log('Payment Intent ID:', event.data.object.id);
      console.log('Payment Intent metadata:', JSON.stringify(event.data.object.metadata, null, 2));
      console.log('Processing payment_intent.succeeded (LIVE MODE)');
      
      const result = await handlePaymentIntentWebhook(event, supabase, stripe);
      console.log('Payment intent webhook result:', result);
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

    console.log('=== WEBHOOK PROCESSING COMPLETE (LIVE MODE) ===');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error (LIVE MODE):', error);
    return new Response('Webhook error', { status: 500, headers: corsHeaders });
  }
});
