
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Stripe with TEST keys for commission webhooks
const stripe = new (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_TEST') || '',
  {
    apiVersion: '2023-10-16',
    httpClient: (await import('https://esm.sh/stripe@14.21.0')).default.createFetchHttpClient(),
  }
);

import { handleCommissionWebhook } from './handlers/commission-webhook.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== COMMISSION WEBHOOK EVENT RECEIVED (TEST MODE) ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      console.log('Commission webhook verified with TEST secret');
    } catch (error) {
      console.error('Commission webhook signature verification failed:', error);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Commission webhook event type:', event.type, 'ID:', event.id);

    // Handle commission-related webhooks (from test environment)
    if (event.data.object.metadata?.type === 'commission_payment' || 
        event.type.includes('payment_intent') || 
        event.type.includes('charge')) {
      console.log('Processing commission webhook:', event.type, '(TEST MODE)');
      await handleCommissionWebhook(event, supabase);
    }

    console.log('=== COMMISSION WEBHOOK PROCESSING COMPLETE ===');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Commission webhook error:', error);
    return new Response('Commission webhook error', { status: 500, headers: corsHeaders });
  }
});
