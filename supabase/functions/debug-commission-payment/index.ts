
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple debugging function to test each component
const logStep = (step: string, data?: any, level: 'INFO' | 'ERROR' | 'DEBUG' = 'INFO') => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}] [DEBUG-COMMISSION]`;
  
  if (data) {
    console.log(`${prefix} ${step}:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${prefix} ${step}`);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    logStep('=== DEBUG COMMISSION PAYMENT START ===');
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    };

    // Step 1: Check environment variables
    logStep('Step 1: Checking environment variables');
    const envVars = {
      STRIPE_SECRET_KEY_TEST: !!Deno.env.get('STRIPE_SECRET_KEY_TEST'),
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_ANON_KEY: !!Deno.env.get('SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    };
    
    debugInfo.environment = envVars;
    logStep('Environment variables check', envVars);

    // Step 2: Test request body parsing
    logStep('Step 2: Testing request body parsing');
    let requestBody;
    try {
      const rawBody = await req.text();
      requestBody = JSON.parse(rawBody);
      debugInfo.requestBody = requestBody;
      logStep('Request body parsed successfully', requestBody);
    } catch (parseError) {
      logStep('Request body parse error', { error: parseError.message }, 'ERROR');
      debugInfo.parseError = parseError.message;
    }

    // Step 3: Test Stripe initialization
    logStep('Step 3: Testing Stripe initialization');
    let stripeTest: any = { status: 'not_tested' };
    try {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY_TEST');
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
        const account = await stripe.accounts.retrieve();
        stripeTest = {
          status: 'success',
          accountId: account.id,
          country: account.country,
          testMode: !account.livemode
        };
        logStep('Stripe test successful', stripeTest);
      } else {
        stripeTest = { status: 'no_key', message: 'STRIPE_SECRET_KEY_TEST not found' };
        logStep('Stripe key missing', stripeTest, 'ERROR');
      }
    } catch (stripeError) {
      stripeTest = { status: 'error', message: stripeError.message };
      logStep('Stripe test failed', stripeTest, 'ERROR');
    }
    debugInfo.stripeTest = stripeTest;

    // Step 4: Test Supabase initialization
    logStep('Step 4: Testing Supabase initialization');
    let supabaseTest: any = { status: 'not_tested' };
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        // Simple test query
        const { data, error } = await supabase
          .from('commission_requests')
          .select('id')
          .limit(1);
        
        if (error) {
          supabaseTest = { status: 'query_error', message: error.message };
          logStep('Supabase query failed', supabaseTest, 'ERROR');
        } else {
          supabaseTest = { status: 'success', message: 'Database connection working' };
          logStep('Supabase test successful', supabaseTest);
        }
      } else {
        supabaseTest = { status: 'no_keys', message: 'Supabase keys missing' };
        logStep('Supabase keys missing', supabaseTest, 'ERROR');
      }
    } catch (supabaseError) {
      supabaseTest = { status: 'error', message: supabaseError.message };
      logStep('Supabase test failed', supabaseTest, 'ERROR');
    }
    debugInfo.supabaseTest = supabaseTest;

    // Step 5: Test authentication if auth header provided
    logStep('Step 5: Testing authentication');
    let authTest: any = { status: 'not_tested' };
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
        
        if (supabaseUrl && supabaseAnonKey) {
          const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
          const token = authHeader.replace('Bearer ', '');
          const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
          
          if (authError) {
            authTest = { status: 'auth_error', message: authError.message };
            logStep('Authentication failed', authTest, 'ERROR');
          } else if (user) {
            authTest = { 
              status: 'success', 
              userId: user.id, 
              email: user.email,
              hasEmail: !!user.email 
            };
            logStep('Authentication successful', authTest);
          } else {
            authTest = { status: 'no_user', message: 'No user returned' };
            logStep('No user from auth', authTest, 'ERROR');
          }
        } else {
          authTest = { status: 'no_supabase_keys', message: 'Supabase client keys missing' };
        }
      } else {
        authTest = { status: 'no_auth_header', message: 'No Authorization header provided' };
      }
    } catch (authError) {
      authTest = { status: 'error', message: authError.message };
      logStep('Auth test failed', authTest, 'ERROR');
    }
    debugInfo.authTest = authTest;

    logStep('=== DEBUG COMMISSION PAYMENT COMPLETE ===', debugInfo);

    return new Response(JSON.stringify({ 
      success: true,
      debug: debugInfo,
      message: 'Debug information collected successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logStep('=== CRITICAL ERROR IN DEBUG FUNCTION ===', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    }, 'ERROR');
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      message: 'Debug function failed - check logs for details'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
