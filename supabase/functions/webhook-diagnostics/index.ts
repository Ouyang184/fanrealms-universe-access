
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook diagnostics function called');

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Initialize Stripe TEST to check webhooks
    const stripeTestKey = Deno.env.get('STRIPE_SECRET_KEY_TEST')
    if (!stripeTestKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing Stripe test secret key',
        recommendation: 'Add STRIPE_SECRET_KEY_TEST to your Supabase secrets'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeTestKey)

    console.log('Checking Stripe webhook endpoints...');

    // List all webhook endpoints
    const webhookEndpoints = await stripe.webhookEndpoints.list({
      limit: 10
    });

    console.log(`Found ${webhookEndpoints.data.length} webhook endpoints`);

    const diagnostics = {
      webhookEndpoints: webhookEndpoints.data.map(endpoint => ({
        id: endpoint.id,
        url: endpoint.url,
        status: endpoint.status,
        enabled_events: endpoint.enabled_events,
        created: new Date(endpoint.created * 1000).toISOString(),
        livemode: endpoint.livemode
      })),
      expectedWebhookUrl: `${supabaseUrl}/functions/v1/stripe-webhook`,
      testWebhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST') ? 'Set' : 'Missing',
      liveWebhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET') ? 'Set' : 'Missing',
      recommendations: []
    };

    // Check if we have the right webhook URL configured
    const expectedUrl = `${supabaseUrl}/functions/v1/stripe-webhook`;
    const hasCorrectWebhook = webhookEndpoints.data.some(endpoint => 
      endpoint.url === expectedUrl && !endpoint.livemode
    );

    if (!hasCorrectWebhook) {
      diagnostics.recommendations.push({
        issue: 'Missing test webhook endpoint',
        solution: `Add webhook endpoint: ${expectedUrl}`,
        priority: 'HIGH'
      });
    }

    // Check for required events
    const requiredEvents = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.captured',
      'charge.refunded'
    ];

    const configuredWebhook = webhookEndpoints.data.find(endpoint => 
      endpoint.url === expectedUrl && !endpoint.livemode
    );

    if (configuredWebhook) {
      const missingEvents = requiredEvents.filter(event => 
        !configuredWebhook.enabled_events.includes(event)
      );

      if (missingEvents.length > 0) {
        diagnostics.recommendations.push({
          issue: 'Missing required webhook events',
          solution: `Add these events to your webhook: ${missingEvents.join(', ')}`,
          priority: 'HIGH'
        });
      }
    }

    // Check webhook secrets
    if (!Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST')) {
      diagnostics.recommendations.push({
        issue: 'Missing test webhook secret',
        solution: 'Add STRIPE_WEBHOOK_SECRET_TEST to your Supabase secrets',
        priority: 'HIGH'
      });
    }

    // Get recent events to see what Stripe has been sending
    console.log('Checking recent Stripe events...');
    const recentEvents = await stripe.events.list({
      limit: 10,
      types: ['checkout.session.completed', 'payment_intent.succeeded']
    });

    diagnostics.recentStripeEvents = recentEvents.data.map(event => ({
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
      object_id: event.data.object.id,
      livemode: event.livemode
    }));

    return new Response(JSON.stringify(diagnostics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Webhook diagnostics error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
