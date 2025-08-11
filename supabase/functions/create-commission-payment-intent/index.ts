import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeSecret =
    Deno.env.get("STRIPE_SECRET_KEY") ||
    Deno.env.get("STRIPE_SECRET_KEY_LIVE") ||
    Deno.env.get("STRIPE_SECRET_KEY_TEST") ||
    "";

  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
  });
  const supabaseServiceClient = createClient(supabaseUrl, supabaseService, {
    auth: { persistSession: false },
  });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser(token);
    if (authError || !authData.user) throw new Error("User not authenticated");

    const user = authData.user;

    const body = await req.json().catch(() => ({}));
    const { commissionId } = body as { commissionId?: string };
    if (!commissionId) throw new Error("commissionId is required");

    // Fetch commission request
    const { data: commission, error: crErr } = await supabaseServiceClient
      .from("commission_requests")
      .select("id, customer_id, creator_id, agreed_price, status")
      .eq("id", commissionId)
      .maybeSingle();

    if (crErr) throw crErr;
    if (!commission) throw new Error("Commission request not found");
    if (commission.customer_id !== user.id) throw new Error("Not authorized for this commission");
    if (commission.status !== "pending") throw new Error("Commission is not payable in current status");
    if (!commission.agreed_price) throw new Error("No agreed price set for this commission");

    const amountCents = Math.round(Number(commission.agreed_price) * 100);

    if (!stripeSecret) throw new Error("Stripe secret key not configured");
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    // Ensure a customer exists
    let customerId: string | undefined;
    if (user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email ?? undefined });
      customerId = customer.id;
    }

    // Create PaymentIntent with manual capture for authorization flow
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      capture_method: "manual",
      metadata: {
        commission_request_id: commission.id,
        creator_id: commission.creator_id,
        user_id: user.id,
        purpose: "commission_payment",
      },
    });

    // Update commission request with PI id and mark as payment_pending
    await supabaseServiceClient
      .from("commission_requests")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: "payment_pending",
      })
      .eq("id", commission.id);

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    console.error("[create-commission-payment-intent] Error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
