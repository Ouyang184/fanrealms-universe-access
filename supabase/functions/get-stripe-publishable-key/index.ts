import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Prefer Sandbox/Test keys for safety; fallback to generic/live
    // Prefer LIVE keys first, then fallback to generic/test/sandbox
    const order = [
      "STRIPE_PUBLISHABLE_KEY_LIVE",
      "STRIPE_PUBLISHABLE_KEY",
      "STRIPE_PUBLISHABLE_KEY_TEST",
      "STRIPE_PUBLISHABLE_KEY_SANDBOX",
    ] as const;

    let publishableKey: string | undefined;
    let mode: "live" | "default" | "test" | "sandbox" = "default";

    for (const k of order) {
      const v = Deno.env.get(k);
      if (v && v.trim().length > 0) {
        publishableKey = v.trim();
        if (k === "STRIPE_PUBLISHABLE_KEY_LIVE") mode = "live";
        else if (k === "STRIPE_PUBLISHABLE_KEY_TEST") mode = "test";
        else if (k === "STRIPE_PUBLISHABLE_KEY_SANDBOX") mode = "sandbox";
        break;
      }
    }

    if (!publishableKey) {
      return new Response(
        JSON.stringify({ error: "No Stripe publishable key configured in Supabase secrets." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    return new Response(
      JSON.stringify({ publishableKey, mode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
