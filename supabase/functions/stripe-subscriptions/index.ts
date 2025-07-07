// MINIMAL TEST VERSION - Step-by-step debugging
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 [MINIMAL-TEST] Function started successfully');
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('📋 [MINIMAL-TEST] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 [MINIMAL-TEST] Processing request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Test 1: Basic function execution
    console.log('✅ [MINIMAL-TEST] Test 1 PASSED: Function executes');

    // Test 2: Request body parsing
    let body;
    try {
      body = await req.json();
      console.log('✅ [MINIMAL-TEST] Test 2 PASSED: Request body parsed:', body);
    } catch (parseError) {
      console.log('❌ [MINIMAL-TEST] Test 2 FAILED: Body parse error:', parseError.message);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Test 3: Environment variables check
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY_LIVE');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔑 [MINIMAL-TEST] Environment check:', {
      hasStripeKey: !!stripeKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      stripeKeyLength: stripeKey?.length || 0
    });

    if (!stripeKey) {
      console.log('❌ [MINIMAL-TEST] Test 3 FAILED: Missing Stripe key');
      return new Response(JSON.stringify({ error: 'Missing Stripe configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ [MINIMAL-TEST] Test 3 FAILED: Missing Supabase config');
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [MINIMAL-TEST] Test 3 PASSED: Environment variables present');

    // Test 4: Authentication header check
    const authHeader = req.headers.get('Authorization');
    console.log('🔐 [MINIMAL-TEST] Auth header check:', {
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0
    });

    if (!authHeader) {
      console.log('❌ [MINIMAL-TEST] Test 4 FAILED: Missing auth header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ [MINIMAL-TEST] Test 4 PASSED: Auth header present');

    // Success response
    const result = {
      success: true,
      message: 'All basic tests passed!',
      tests: {
        functionExecution: true,
        bodyParsing: true,
        environmentVariables: true,
        authenticationHeader: true
      },
      receivedData: {
        action: body.action,
        tierId: body.tierId,
        creatorId: body.creatorId
      },
      timestamp: new Date().toISOString()
    };

    console.log('🎉 [MINIMAL-TEST] All tests passed! Returning success response:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log('💥 [MINIMAL-TEST] CRITICAL ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(JSON.stringify({ 
      error: 'Critical function error',
      details: error.message,
      type: error.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});