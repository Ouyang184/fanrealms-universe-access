
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Import handlers
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import { StripeCustomerService } from './services/stripe-customer.ts';
import { corsHeaders } from './utils/cors.ts';
import { authenticateUser } from './utils/auth.ts';

// Initialize Stripe with TEST key to match commission payments
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_TEST') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== STRIPE SUBSCRIPTIONS REQUEST (TEST MODE) ===');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ...requestData } = await req.json();
    
    console.log('Action:', action, 'Data:', requestData);

    // Authenticate user for most actions
    let user = null;
    if (action !== 'get-subscriber-count') {
      user = await authenticateUser(req, supabase);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const customerService = new StripeCustomerService(stripe, supabase);

    switch (action) {
      case 'create-subscription':
        return await handleCreateSubscription(requestData, stripe, supabase, user, customerService);
      
      case 'cancel-subscription':
        return await handleCancelSubscription(requestData, stripe, supabase, user);
      
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Subscription error (TEST MODE):', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
