
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCreateSubscription } from './handlers/create-subscription.ts';
import { handleCancelSubscription } from './handlers/cancel-subscription.ts';
import { handleGetUserSubscriptions } from './handlers/get-user-subscriptions.ts';
import { handleVerifySubscription } from './handlers/verify-subscription.ts';
import { handleReactivateSubscription } from './handlers/reactivate-subscription.ts';
import { handleGetSubscriberCount } from './handlers/get-subscriber-count.ts';
import { handleSyncAllSubscriptions } from './handlers/sync-all-subscriptions.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use LIVE Stripe keys for subscriptions
const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY_LIVE') || ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[StripeSubscriptions] Request received:', req.method);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[StripeSubscriptions] Missing Supabase configuration');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error - missing Supabase configuration' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    if (!authHeader) {
      console.error('[StripeSubscriptions] Missing authorization header');
      return new Response(JSON.stringify({ 
        error: 'Authentication required - missing authorization header' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Verify Stripe key is available
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE');
    if (!stripeKey) {
      console.error('[StripeSubscriptions] Missing Stripe secret key');
      return new Response(JSON.stringify({ 
        error: 'Server configuration error - missing Stripe configuration' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Create clients
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    console.log('[StripeSubscriptions] Authenticating user...');
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError) {
      console.error('[StripeSubscriptions] Authentication error:', authError);
      return new Response(JSON.stringify({ 
        error: `Authentication failed: ${authError.message}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    if (!user) {
      console.error('[StripeSubscriptions] No user found in auth');
      return new Response(JSON.stringify({ 
        error: 'User not authenticated' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    console.log('[StripeSubscriptions] User authenticated:', user.id);

    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('[StripeSubscriptions] Raw request body:', bodyText);
      
      if (!bodyText) {
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('[StripeSubscriptions] Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('[StripeSubscriptions] Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid request body - must be valid JSON' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const { action, tierId, creatorId, subscriptionId, immediate } = requestBody;
    
    if (!action) {
      console.error('[StripeSubscriptions] Missing action in request');
      return new Response(JSON.stringify({ 
        error: 'Missing required field: action' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('[StripeSubscriptions] Processing action:', action, 'with params:', {
      tierId, creatorId, subscriptionId, immediate
    });

    let result;

    try {
      switch (action) {
        case 'create_subscription':
          if (!tierId || !creatorId) {
            console.error('[StripeSubscriptions] Missing required fields for create_subscription:', {
              tierId, creatorId
            });
            return new Response(JSON.stringify({ 
              error: 'Missing required fields: tierId and creatorId are required for create_subscription' 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            });
          }
          result = await handleCreateSubscription(stripe, supabase, user, { tierId, creatorId });
          break;

        case 'cancel_subscription':
          if (!tierId || !creatorId) {
            console.error('[StripeSubscriptions] Missing required fields for cancel_subscription:', {
              tierId, creatorId
            });
            return new Response(JSON.stringify({ 
              error: 'Missing required fields: tierId and creatorId are required for cancel_subscription' 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            });
          }
          result = await handleCancelSubscription(stripe, supabase, user, { tierId, creatorId, immediate });
          break;

        case 'get_user_subscriptions':
          result = await handleGetUserSubscriptions(supabase, user);
          break;

        case 'verify_subscription':
          if (!tierId || !creatorId) {
            console.error('[StripeSubscriptions] Missing required fields for verify_subscription:', {
              tierId, creatorId
            });
            return new Response(JSON.stringify({ 
              error: 'Missing required fields: tierId and creatorId are required for verify_subscription' 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            });
          }
          result = await handleVerifySubscription(stripe, supabase, user, { tierId, creatorId });
          break;

        case 'reactivate_subscription':
          if (!subscriptionId) {
            console.error('[StripeSubscriptions] Missing required field for reactivate_subscription:', {
              subscriptionId
            });
            return new Response(JSON.stringify({ 
              error: 'Missing required field: subscriptionId is required for reactivate_subscription' 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            });
          }
          result = await handleReactivateSubscription(stripe, supabase, user, { subscriptionId });
          break;

        case 'get_subscriber_count':
          if (!creatorId) {
            console.error('[StripeSubscriptions] Missing required field for get_subscriber_count:', {
              creatorId
            });
            return new Response(JSON.stringify({ 
              error: 'Missing required field: creatorId is required for get_subscriber_count' 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            });
          }
          result = await handleGetSubscriberCount(stripe, supabase, creatorId);
          break;

        case 'sync_all_subscriptions':
          result = await handleSyncAllSubscriptions(stripe, supabase, user);
          break;

        default:
          console.error('[StripeSubscriptions] Invalid action:', action);
          return new Response(JSON.stringify({ 
            error: `Invalid action: ${action}` 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
      }

      console.log('[StripeSubscriptions] Action completed successfully:', action);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (actionError) {
      console.error(`[StripeSubscriptions] Error in action ${action}:`, actionError);
      
      // Check if it's a Stripe error
      if (actionError.type && actionError.type.startsWith('Stripe')) {
        console.error('[StripeSubscriptions] Stripe API error:', actionError.message, actionError.code);
        return new Response(JSON.stringify({ 
          error: `Stripe error: ${actionError.message}`,
          code: actionError.code,
          type: actionError.type
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      return new Response(JSON.stringify({ 
        error: actionError.message || 'An error occurred processing your request' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

  } catch (error) {
    console.error('[StripeSubscriptions] Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
