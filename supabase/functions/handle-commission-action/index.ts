
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Handle commission action function started');
    
    const { commissionId, action } = await req.json();
    
    console.log('Handling commission action:', { commissionId, action });

    // Validate input
    if (!commissionId || !action) {
      console.error('Missing required parameters:', { commissionId, action });
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: commissionId and action are required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!['accept', 'reject'].includes(action)) {
      console.error('Invalid action:', action);
      return new Response(JSON.stringify({ 
        error: 'Invalid action. Must be "accept" or "reject"' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not found');
      return new Response(JSON.stringify({ 
        error: 'Stripe configuration missing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({ 
        error: 'Supabase configuration missing' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Authentication failed' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    console.log('User authenticated:', user.id);

    // Fetch commission request with creator check
    const { data: commissionRequest, error: fetchError } = await supabaseService
      .from('commission_requests')
      .select(`
        *,
        creator:creators!commission_requests_creator_id_fkey(
          display_name,
          user_id
        )
      `)
      .eq('id', commissionId)
      .single();

    if (fetchError) {
      console.error('Error fetching commission request:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Commission request not found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (!commissionRequest) {
      console.error('Commission request not found for ID:', commissionId);
      return new Response(JSON.stringify({ 
        error: 'Commission request not found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log('Commission request found:', commissionRequest.id);
    console.log('Creator info:', commissionRequest.creator);

    // Verify user is the creator
    if (commissionRequest.creator?.user_id !== user.id) {
      console.error('Unauthorized: User is not the creator', {
        userID: user.id,
        creatorUserID: commissionRequest.creator?.user_id
      });
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Only the creator can perform this action' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    let paymentIntentId = commissionRequest.stripe_payment_intent_id;
    
    if (!paymentIntentId) {
      console.error('No payment intent found for commission:', commissionId);
      return new Response(JSON.stringify({ 
        error: 'No payment intent found for this commission' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Handle case where we stored session ID instead of payment intent ID
    if (paymentIntentId.startsWith('cs_')) {
      console.log('Found session ID instead of payment intent ID, retrieving payment intent from session:', paymentIntentId);
      try {
        const session = await stripe.checkout.sessions.retrieve(paymentIntentId);
        if (!session.payment_intent) {
          console.error('No payment intent found in session:', paymentIntentId);
          return new Response(JSON.stringify({ 
            error: 'No payment intent found in the checkout session' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        paymentIntentId = session.payment_intent as string;
        console.log('Retrieved payment intent ID from session:', paymentIntentId);

        // Update the database with the correct payment intent ID
        await supabaseService
          .from('commission_requests')
          .update({ stripe_payment_intent_id: paymentIntentId })
          .eq('id', commissionId);
        console.log('Updated commission record with correct payment intent ID');
      } catch (sessionError) {
        console.error('Error retrieving session:', sessionError);
        return new Response(JSON.stringify({ 
          error: 'Failed to retrieve payment information from checkout session' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    console.log('Processing action:', action, 'for payment intent:', paymentIntentId);

    if (action === 'accept') {
      console.log('Accepting commission and capturing payment:', paymentIntentId);
      
      try {
        // Capture the authorized payment
        const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
        console.log('Payment captured successfully:', paymentIntent.id);
        
        // Update commission status to accepted
        const { error: updateError } = await supabaseService
          .from('commission_requests')
          .update({ 
            status: 'accepted',
            creator_notes: 'Commission accepted and payment captured'
          })
          .eq('id', commissionId);

        if (updateError) {
          console.error('Failed to update commission status:', updateError);
          return new Response(JSON.stringify({ 
            error: 'Failed to update commission status' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        console.log('Commission accepted and payment captured successfully');
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Commission accepted and payment captured',
          paymentIntent: paymentIntent.id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (stripeError) {
        console.error('Stripe error during payment capture:', stripeError);
        return new Response(JSON.stringify({ 
          error: 'Failed to capture payment: ' + stripeError.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

    } else if (action === 'reject') {
      console.log('Rejecting commission and canceling payment:', paymentIntentId);
      
      try {
        // Cancel the authorized payment (refunds to customer)
        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
        console.log('Payment canceled successfully:', paymentIntent.id);
        
        // Update commission status to rejected
        const { error: updateError } = await supabaseService
          .from('commission_requests')
          .update({ 
            status: 'rejected',
            creator_notes: 'Commission rejected and payment canceled'
          })
          .eq('id', commissionId);

        if (updateError) {
          console.error('Failed to update commission status:', updateError);
          return new Response(JSON.stringify({ 
            error: 'Failed to update commission status' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        console.log('Commission rejected and payment canceled successfully');
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Commission rejected and payment canceled',
          paymentIntent: paymentIntent.id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (stripeError) {
        console.error('Stripe error during payment cancellation:', stripeError);
        return new Response(JSON.stringify({ 
          error: 'Failed to cancel payment: ' + stripeError.message 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

  } catch (error) {
    console.error('Commission action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
