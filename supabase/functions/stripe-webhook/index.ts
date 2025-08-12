

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
    console.log('Stripe webhook received');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret =
      Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST') ||
      Deno.env.get('STRIPE_WEBHOOK_SECRET_SANDBOX') ||
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ||
      Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE');

    // Environment variables presence checked

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
      console.error('Webhook signature verification failed');
      return new Response(JSON.stringify({ 
        error: 'Webhook signature verification failed'
      }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('Webhook event type:', event.type, 'ID:', event.id, '(TEST MODE)');

    // Handle payment intent webhooks FIRST - these are critical for custom payment flow
    if (event.type === 'payment_intent.succeeded') {
      console.log('Handling payment_intent.succeeded', event.id);
      
      try {
        const result = await handlePaymentIntentWebhook(event, supabase, stripe);
        
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
      console.log('Handling subscription webhook', event.type);
      try {
        const result = await handleSubscriptionWebhook(event, supabase, stripe);
        
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
      console.log('Handling checkout.session.completed');
      try {
        await handleCheckoutWebhook(event, supabase, stripe);
      } catch (error) {
        console.error('Checkout webhook error:', error);
      }
    }

    // Handle commission-related webhooks
    if (event.type === 'payment_intent.canceled' || 
        event.type === 'charge.refunded') {
      console.log('Handling commission webhook', event.type);
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
      console.log('Handling payment method webhook', event.type);
      try {
        await handlePaymentMethodWebhook(event, supabase);
      } catch (error) {
        console.error('Payment method webhook error:', error);
      }
    }

    // Handle price webhooks
    if (event.type.startsWith('price.')) {
      console.log('Handling price webhook', event.type);
      try {
        await handlePriceWebhook(event, supabase);
      } catch (error) {
        console.error('Price webhook error:', error);
      }
    }

    // Handle product webhooks
    if (event.type.startsWith('product.')) {
      console.log('Handling product webhook', event.type);
      try {
        await handleProductWebhook(event, supabase);
      } catch (error) {
        console.error('Product webhook error:', error);
      }
    }

    
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

