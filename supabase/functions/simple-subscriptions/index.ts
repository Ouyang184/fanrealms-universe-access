
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCreateSubscription } from './handlers/subscription-handler.ts';
import { handleCancelSubscription } from './handlers/cancellation-handler.ts';
import { handleGetUserSubscriptions, handleGetCreatorSubscribers } from './handlers/data-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use TEST Stripe keys consistently
const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_TEST') || ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Create clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    const { action, tierId, creatorId, subscriptionId, paymentIntentId, immediate } = await req.json();
    console.log('[SimpleSubscriptions] Action:', action, 'TierId:', tierId, 'CreatorId:', creatorId, 'Immediate:', immediate, '(TEST MODE)');

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
    console.error('[SimpleSubscriptions] Error (TEST MODE):', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
