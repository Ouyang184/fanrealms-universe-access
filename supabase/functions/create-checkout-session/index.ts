import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded allowlist — never trust client-supplied Origin for redirect URLs
const ALLOWED_ORIGINS = [
  "https://fanrealms.com",
  "https://www.fanrealms.com",
  "https://fanrealms-universe-access.lovable.app",
];
const DEFAULT_ORIGIN = "https://fanrealms.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const stripeSecret =
    Deno.env.get("STRIPE_SECRET_KEY") ||            // live (preferred)
    Deno.env.get("STRIPE_SECRET_KEY_LIVE") ||
    Deno.env.get("STRIPE_SECRET_KEY_TEST") ||
    Deno.env.get("STRIPE_SECERT_KEY_SANDBOX") ||    // typo kept for compat
    Deno.env.get("STRIPE_SECRET_KEY_SANDBOX") ||
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
    const { productId, customPrice } = body as { productId?: string; customPrice?: number };
    if (!productId) throw new Error("productId is required");

    // Fetch product
    const { data: product, error: productError } = await supabaseServiceClient
      .from("digital_products")
      .select("id, title, price, pricing_model, creator_id, short_description, cover_image_url, creators(user_id)")
      .eq("id", productId)
      .eq("status", "published")
      .maybeSingle();

    if (productError) throw productError;
    if (!product) throw new Error("Product not found or not published");

    // Self-purchase guard
    const creatorUserId = (product.creators as any)?.user_id;
    if (creatorUserId && creatorUserId === user.id) {
      throw new Error("You cannot purchase your own product");
    }

    // Determine final amount:
    // - name_your_price: use customPrice supplied by buyer (validated below)
    // - paid: use product.price
    let amountCents: number;
    const pricingModel = (product as any).pricing_model ?? 'paid';

    if (pricingModel === 'name_your_price') {
      if (customPrice === undefined || customPrice === null) {
        throw new Error("Please enter a price.");
      }
      const customCents = Math.round(Number(customPrice) * 100);
      if (isNaN(customCents) || customCents < 50) {
        throw new Error("Minimum price is $0.50.");
      }
      amountCents = customCents;
    } else {
      amountCents = Math.round(Number(product.price) * 100);
      if (amountCents < 50) throw new Error("Product price is below Stripe minimum ($0.50)");
    }

    // Fetch creator's fee rate and Stripe Connect status
    const { data: creatorData, error: creatorFetchErr } = await supabaseServiceClient
      .from('creators')
      .select('platform_fee_rate')
      .eq('id', product.creator_id)
      .maybeSingle();
    if (creatorFetchErr) console.warn('[create-checkout-session] creator fetch error:', creatorFetchErr.message);

    const { data: stripeAccount, error: stripeAcctErr } = await supabaseServiceClient
      .from('creator_stripe_accounts')
      .select('stripe_account_id, stripe_charges_enabled')
      .eq('creator_id', product.creator_id)
      .maybeSingle();
    if (stripeAcctErr) console.warn('[create-checkout-session] stripe account fetch error:', stripeAcctErr.message);

    const platformFeeRate = creatorData?.platform_fee_rate ?? 5;
    const hasConnect =
      !!stripeAccount?.stripe_charges_enabled &&
      !!stripeAccount?.stripe_account_id;
    const applicationFeeAmount = hasConnect
      ? Math.round(amountCents * platformFeeRate / 100)
      : 0;

    // Use allowlist — never trust attacker-controlled Origin header
    const requestOrigin = req.headers.get("Origin") ?? "";
    const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : DEFAULT_ORIGIN;

    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" });

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: product.title,
              description: (product as any).short_description || undefined,
              images: (product as any).cover_image_url
                ? [(product as any).cover_image_url]
                : undefined,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        product_id: product.id,
        buyer_id: user.id,
        creator_id: product.creator_id,
      },
      success_url: `${origin}/purchase-success?product_id=${productId}`,
      cancel_url: `${origin}/marketplace/${productId}`,
    };

    if (hasConnect) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccount.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-checkout-session] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
