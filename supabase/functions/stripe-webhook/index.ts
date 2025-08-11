

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe with test/sandbox keys when available
const stripeSecretKey =
  Deno.env.get('STRIPE_SECRET_KEY_TEST') ||
  Deno.env.get('STRIPE_SECRET_KEY_SANDBOX') ||
  Deno.env.get('STRIPE_SECRET_KEY') ||
  Deno.env.get('STRIPE_SECRET_KEY_LIVE');
const stripe = new (await import('https://esm.sh/stripe@14.21.0')).default(
  stripeSecretKey,
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
import { handlePaymentMethodWebhook } from './handlers/payment-method-webhook.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== WEBHOOK EVENT RECEIVED (TEST MODE) ===');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret =
      Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST') ||
      Deno.env.get('STRIPE_WEBHOOK_SECRET_SANDBOX') ||
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ||
      Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE');

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
        Sandbox_wehook_secert: !!webhookSecret
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
      console.log('Webhook signature verified successfully (TEST MODE)');
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

    console.log('Webhook event type:', event.type, 'ID:', event.id, '(TEST MODE)');

    // Handle payment intent webhooks FIRST - these are critical for custom payment flow
    if (event.type === 'payment_intent.succeeded') {
      console.log('===== PAYMENT INTENT SUCCEEDED WEBHOOK RECEIVED =====');
      console.log('Event ID:', event.id);
      console.log('Payment Intent ID:', event.data.object.id);
      console.log('Payment Intent metadata:', JSON.stringify(event.data.object.metadata, null, 2));
      console.log('Processing payment_intent.succeeded (LIVE MODE)');
      
      try {
        const result = await handlePaymentIntentWebhook(event, supabase, stripe);
        console.log('Payment intent webhook result:', result);
        return result;
      } catch (error) {
        console.error('Payment intent webhook error:', error);
        return new Response(JSON.stringify({ 
          error: 'Payment intent webhook failed',
          details: error.message 
        }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // Handle subscription-related webhooks 
    if (event.type.startsWith('customer.subscription.') || event.type === 'invoice.payment_succeeded') {
      console.log('Processing subscription webhook:', event.type, '(LIVE MODE)');
      try {
        const result = await handleSubscriptionWebhook(event, supabase, stripe);
        console.log('Subscription webhook result:', result);
        return result;
      } catch (error) {
        console.error('Subscription webhook error:', error);
        return new Response(JSON.stringify({ 
          error: 'Subscription webhook failed',
          details: error.message 
        }), { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // Handle checkout session completed events
    if (event.type === 'checkout.session.completed') {
      console.log('Processing checkout.session.completed (LIVE MODE)');
      try {
        await handleCheckoutWebhook(event, supabase, stripe);
      } catch (error) {
        console.error('Checkout webhook error:', error);
      }
    }

    // Handle commission-related webhooks
    if (event.type === 'payment_intent.canceled' || 
        event.type === 'charge.refunded') {
      console.log('Processing commission webhook:', event.type, '(LIVE MODE)');
      try {
        await handleCommissionWebhook(event, supabase);
      } catch (error) {
        console.error('Commission webhook error:', error);
      }
    }

    // Handle payment method webhooks
    if (event.type === 'customer.updated' || 
        event.type === 'payment_method.attached' || 
        event.type === 'payment_method.detached' ||
        event.type === 'setup_intent.succeeded' ||
        event.type === 'setup_intent.canceled') {
      console.log('Processing payment method webhook:', event.type, '(LIVE MODE)');
      try {
        await handlePaymentMethodWebhook(event, supabase);
      } catch (error) {
        console.error('Payment method webhook error:', error);
      }
    }

    // Handle price webhooks
    if (event.type.startsWith('price.')) {
      console.log('Processing price webhook:', event.type, '(LIVE MODE)');
      try {
        await handlePriceWebhook(event, supabase);
      } catch (error) {
        console.error('Price webhook error:', error);
      }
    }

    // Handle product webhooks
    if (event.type.startsWith('product.')) {
      console.log('Processing product webhook:', event.type, '(LIVE MODE)');
      try {
        await handleProductWebhook(event, supabase);
      } catch (error) {
        console.error('Product webhook error:', error);
      }
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE (LIVE MODE) ===');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error (LIVE MODE):', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      details: error.message 
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

