
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCreateSubscription } from './handlers/subscription-handler.ts';
import { handleCancelSubscription } from './handlers/cancellation-handler.ts';
import { handleGetUserSubscriptions, handleGetCreatorSubscribers } from './handlers/data-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use LIVE Stripe keys
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE') || Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeKey) {
  console.error('[SimpleSubscriptions] CRITICAL: No Stripe key found in environment variables');
}

const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(stripeKey || '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SimpleSubscriptions] Function invoked, checking environment...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');

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

    console.log('[SimpleSubscriptions] Environment variables validated');

    // Create clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseAnonKey) {
      throw new Error('SUPABASE_ANON_KEY environment variable not set');
    }
    
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    console.log('[SimpleSubscriptions] Supabase clients created successfully');

    // Get authenticated user
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { action, tierId, creatorId, subscriptionId, paymentIntentId, immediate } = await req.json();
    console.log('[SimpleSubscriptions] Action:', action, 'TierId:', tierId, 'CreatorId:', creatorId, 'Immediate:', immediate, '(LIVE MODE)');

    let result;

    switch (action) {
      case 'create_subscription':
        result = await handleCreateSubscription(stripe, supabase, user, { tierId, creatorId });
        break;

      case 'cancel_subscription':
        result = await handleCancelSubscription(stripe, supabase, user, { tierId, creatorId, immediate });
        break;

      case 'get_user_subscriptions':
        result = await handleGetUserSubscriptions(supabase, user);
        break;

      case 'get_creator_subscribers':
        result = await handleGetCreatorSubscribers(stripe, supabase, creatorId);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SimpleSubscriptions] Error (LIVE MODE):', error);
    console.error('[SimpleSubscriptions] Error stack:', error.stack);
    console.error('[SimpleSubscriptions] Error details:', JSON.stringify(error, null, 2));
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
