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
    Deno.env.get("STRIPE_SECERT_KEY_SANDBOX") ||   // existing typo kept for compat
    Deno.env.get("STRIPE_SECRET_KEY_SANDBOX") ||
    Deno.env.get("STRIPE_SECRET_KEY_TEST") ||
    Deno.env.get("STRIPE_SECRET_KEY") ||
    Deno.env.get("STRIPE_SECRET_KEY_LIVE") ||
    "";

  if (!stripeSecret) {
    return new Response(
      JSON.stringify({ error: "Stripe secret key not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAuthClient = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
  });
  const supabaseServiceClient = createClient(supabaseUrl, supabaseService, {
    auth: { persistSession: false },
  });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabaseAuthClient.auth.getUser(token);
    if (authError || !authData.user) throw new Error("User not authenticated");
    const user = authData.user;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { productId } = body as { productId?: string };
    if (!productId) throw new Error("productId is required");

    // Fetch product (join creators to get creator's user_id for self-purchase guard)
    const { data: product, error: productError } = await supabaseServiceClient
      .from("digital_products")
      .select("id, title, price, creator_id, creators(user_id)")
      .eq("id", productId)
      .eq("status", "published")
      .maybeSingle();

    if (productError) throw productError;
    if (!product) throw new Error("Product not found or not published");

    // Self-purchase guard — compare auth user id to creator's user_id
    const creatorUserId = (product.creators as any)?.user_id;
    if (creatorUserId && creatorUserId === user.id) {
      throw new Error("You cannot purchase your own product");
    }

    // Convert price to cents
    const amountCents = Math.round(Number(product.price) * 100);
    if (amountCents < 50) throw new Error("Product price is below Stripe minimum ($0.50)");

    // Determine origin for redirect URLs
    const origin =
      req.headers.get("Origin") ||
      req.headers.get("Referer")?.replace(/\/$/, "") ||
      "https://fanrealms.com";

    // Create Stripe Checkout Session
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: product.title },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        product_id: product.id,
        buyer_id: user.id,
        creator_id: product.creator_id,   // creators.id (not auth.users.id)
      },
      success_url: `${origin}/marketplace/${productId}?success=true`,
      cancel_url: `${origin}/marketplace/${productId}`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-checkout-session] Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
