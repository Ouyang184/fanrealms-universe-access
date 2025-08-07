import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commissionRequestId, revisionNotes } = await req.json();

    if (!commissionRequestId || !revisionNotes) {
      throw new Error("Commission request ID and revision notes are required");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    // Get commission request and check if extra revision payment is needed
    const { data: commissionRequest, error: requestError } = await supabaseClient
      .from('commission_requests')
      .select(`
        *,
        commission_type:commission_types!inner(
          max_revisions,
          price_per_revision
        )
      `)
      .eq('id', commissionRequestId)
      .eq('customer_id', user.id)
      .single();

    if (requestError || !commissionRequest) {
      throw new Error("Commission request not found or access denied");
    }

    const { commission_type, revision_count } = commissionRequest;
    const isExtraRevision = revision_count >= commission_type.max_revisions;
    
    if (!isExtraRevision) {
      // Free revision - create revision request without payment
      const { data: revision, error: revisionError } = await supabaseClient
        .from('commission_revisions')
        .insert({
          commission_request_id: commissionRequestId,
          requester_id: user.id,
          revision_number: revision_count + 1,
          request_notes: revisionNotes,
          is_extra_revision: false
        })
        .select()
        .single();

      if (revisionError) throw revisionError;

      // Update revision count
      await supabaseClient
        .from('commission_requests')
        .update({ 
          revision_count: revision_count + 1,
          status: 'revision_requested'
        })
        .eq('id', commissionRequestId);

      return new Response(JSON.stringify({ 
        success: true, 
        revision: revision,
        requiresPayment: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extra revision - requires payment
    if (!commission_type.price_per_revision) {
      throw new Error("Extra revisions are not available for this commission type");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create payment session for extra revision
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `Extra Revision - ${commissionRequest.title}`,
              description: `Additional revision beyond the ${commission_type.max_revisions} included revisions`
            },
            unit_amount: Math.round(commission_type.price_per_revision * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/commissions/revision-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/commissions/${commissionRequestId}`,
      metadata: {
        commission_request_id: commissionRequestId,
        revision_notes: revisionNotes,
        user_id: user.id,
        revision_number: (revision_count + 1).toString()
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      requiresPayment: true,
      paymentUrl: session.url,
      sessionId: session.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating revision payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});