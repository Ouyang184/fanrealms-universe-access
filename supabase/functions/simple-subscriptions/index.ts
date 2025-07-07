
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[SimpleSubscriptions] Function invoked - basic test');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SimpleSubscriptions] Basic functionality test');
    
    // Test environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE') || Deno.env.get('STRIPE_SECRET_KEY');
    
    console.log('[SimpleSubscriptions] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      hasStripeKey: !!stripeKey
    });

    const authHeader = req.headers.get('Authorization');
    console.log('[SimpleSubscriptions] Has auth header:', !!authHeader);

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable not set');
    }
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    }
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    if (!stripeKey) {
      throw new Error('Stripe key not configured - check STRIPE_SECRET_KEY_LIVE or STRIPE_SECRET_KEY');
    }

    const body = await req.json();
    console.log('[SimpleSubscriptions] Request body:', body);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Edge function is working',
      receivedAction: body.action,
      environment: 'LIVE'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SimpleSubscriptions] Error:', error);
    console.error('[SimpleSubscriptions] Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
