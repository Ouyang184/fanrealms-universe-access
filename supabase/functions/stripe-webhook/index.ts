
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
  // Add a simple test endpoint for webhook connectivity
  if (req.method === 'GET') {
    console.log('=== WEBHOOK TEST ENDPOINT HIT ===');
    console.log('Time:', new Date().toISOString());
    console.log('User-Agent:', req.headers.get('user-agent'));
    console.log('URL:', req.url);
    
    return new Response(JSON.stringify({
      status: 'Webhook endpoint is active',
      timestamp: new Date().toISOString(),
      environment: 'LIVE',
      webhookUrl: req.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== WEBHOOK EVENT RECEIVED (LIVE MODE) ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('User-Agent:', req.headers.get('user-agent'));
    console.log('Content-Type:', req.headers.get('content-type'));
    console.log('Content-Length:', req.headers.get('content-length'));
    
    // Log all headers for debugging
    const allHeaders = Object.fromEntries(req.headers.entries());
    console.log('All request headers:', JSON.stringify(allHeaders, null, 2));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasWebhookSecret: !!webhookSecret,
      webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'NOT_SET',
      supabaseUrlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT_SET'
    });

    if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
      console.error('❌ MISSING ENVIRONMENT VARIABLES:', {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
        STRIPE_WEBHOOK_SECRET: !!webhookSecret
      });
      return new Response('Server configuration error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    console.log('Webhook payload analysis:', {
      bodyLength: body.length,
      bodyPreview: body.substring(0, 200) + '...',
      hasSignature: !!signature,
      signatureLength: signature ? signature.length : 0,
      signaturePrefix: signature ? signature.substring(0, 30) + '...' : 'NO_SIGNATURE'
    });

    if (!signature) {
      console.error('❌ MISSING STRIPE SIGNATURE HEADER');
      console.error('Available headers:', Object.keys(allHeaders));
      return new Response('Missing stripe-signature header', { status: 400, headers: corsHeaders });
    }

    let event;
    try {
      console.log('🔐 ATTEMPTING WEBHOOK SIGNATURE VERIFICATION...');
      console.log('Using webhook secret:', webhookSecret.substring(0, 10) + '...');
      
      // Use async webhook construction for Deno compatibility
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('✅ WEBHOOK SIGNATURE VERIFIED SUCCESSFULLY (LIVE MODE)');
      console.log('Event verified:', { id: event.id, type: event.type, created: event.created });
    } catch (err) {
      console.error('❌ WEBHOOK SIGNATURE VERIFICATION FAILED');
      console.error('Error type:', err.type);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Webhook secret length:', webhookSecret.length);
      console.error('Signature received length:', signature.length);
      console.error('Body length:', body.length);
      console.error('First 100 chars of signature:', signature.substring(0, 100));
      console.error('First 200 chars of body:', body.substring(0, 200));
      
      return new Response(JSON.stringify({ 
        error: 'Webhook signature verification failed',
        details: err.message,
        errorType: err.type,
        timestamp: new Date().toISOString()
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎯 PROCESSING WEBHOOK EVENT:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
      livemode: event.livemode,
      apiVersion: event.api_version
    });

    // Log event data for debugging (be careful with sensitive data)
    if (event.data && event.data.object) {
      console.log('Event object type:', event.data.object.object);
      console.log('Event object id:', event.data.object.id);
      if (event.data.object.metadata) {
        console.log('Event metadata:', JSON.stringify(event.data.object.metadata, null, 2));
      }
    }

    // Handle payment intent webhooks FIRST - these are critical for custom payment flow
    if (event.type === 'payment_intent.succeeded') {
      console.log('🔥 PAYMENT INTENT SUCCEEDED WEBHOOK RECEIVED');
      console.log('Event ID:', event.id);
      console.log('Payment Intent ID:', event.data.object.id);
      console.log('Payment Intent amount:', event.data.object.amount);
      console.log('Payment Intent currency:', event.data.object.currency);
      console.log('Payment Intent customer:', event.data.object.customer);
      console.log('Payment Intent metadata:', JSON.stringify(event.data.object.metadata, null, 2));
      
      try {
        const result = await handlePaymentIntentWebhook(event, supabase, stripe);
        console.log('✅ Payment intent webhook completed successfully');
        return result;
      } catch (error) {
        console.error('❌ Payment intent webhook error:', error);
        console.error('Error stack:', error.stack);
        return new Response(JSON.stringify({ 
          error: 'Payment intent webhook failed',
          details: error.message,
          eventId: event.id,
          timestamp: new Date().toISOString()
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle subscription-related webhooks 
    if (event.type.startsWith('customer.subscription.') || event.type === 'invoice.payment_succeeded') {
      console.log('🔄 PROCESSING SUBSCRIPTION WEBHOOK:', event.type);
      try {
        const result = await handleSubscriptionWebhook(event, supabase, stripe);
        console.log('✅ Subscription webhook completed successfully');
        return result;
      } catch (error) {
        console.error('❌ Subscription webhook error:', error);
        console.error('Error stack:', error.stack);
        return new Response(JSON.stringify({ 
          error: 'Subscription webhook failed',
          details: error.message,
          eventId: event.id,
          timestamp: new Date().toISOString()
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle checkout session completed events
    if (event.type === 'checkout.session.completed') {
      console.log('🛒 PROCESSING CHECKOUT SESSION COMPLETED');
      try {
        await handleCheckoutWebhook(event, supabase, stripe);
        console.log('✅ Checkout webhook completed successfully');
      } catch (error) {
        console.error('❌ Checkout webhook error:', error);
        console.error('Error stack:', error.stack);
      }
    }

    // Handle commission-related webhooks
    if (event.type === 'payment_intent.canceled' || 
        event.type === 'charge.refunded') {
      console.log('💰 PROCESSING COMMISSION WEBHOOK:', event.type);
      try {
        await handleCommissionWebhook(event, supabase);
        console.log('✅ Commission webhook completed successfully');
      } catch (error) {
        console.error('❌ Commission webhook error:', error);
        console.error('Error stack:', error.stack);
      }
    }

    // Handle price webhooks
    if (event.type.startsWith('price.')) {
      console.log('💲 PROCESSING PRICE WEBHOOK:', event.type);
      try {
        await handlePriceWebhook(event, supabase);
        console.log('✅ Price webhook completed successfully');
      } catch (error) {
        console.error('❌ Price webhook error:', error);
        console.error('Error stack:', error.stack);
      }
    }

    // Handle product webhooks
    if (event.type.startsWith('product.')) {
      console.log('📦 PROCESSING PRODUCT WEBHOOK:', event.type);
      try {
        await handleProductWebhook(event, supabase);
        console.log('✅ Product webhook completed successfully');
      } catch (error) {
        console.error('❌ Product webhook error:', error);
        console.error('Error stack:', error.stack);
      }
    }

    console.log('✅ WEBHOOK PROCESSING COMPLETE (LIVE MODE)');
    console.log('Event type:', event.type, 'processed at:', new Date().toISOString());
    
    return new Response(JSON.stringify({
      received: true,
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString()
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 WEBHOOK CRITICAL ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error occurred at:', new Date().toISOString());
    
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      details: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
