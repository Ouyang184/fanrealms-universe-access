import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentMethodData {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[PAYMENT-METHODS] Processing request:', req.method);

    // Get Stripe key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Stripe configuration missing');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Initialize Supabase clients
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('Authentication required');
    }

    const user = userData.user;
    console.log('[PAYMENT-METHODS] User authenticated:', user.id);

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    // Check if customer exists in our database
    const { data: existingCustomer } = await supabaseService
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Check Stripe directly
      const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
      
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: user.email!,
          metadata: { user_id: user.id }
        });
        stripeCustomerId = customer.id;
      }

      // Store customer ID
      await supabaseService
        .from('stripe_customers')
        .upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomerId
        });
    }

    if (req.method === 'GET') {
      // Get payment methods
      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card'
      });

      console.log('[PAYMENT-METHODS] Found', paymentMethods.data.length, 'payment methods');

      // Get default payment method
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      const defaultPaymentMethodId = typeof customer === 'object' && 'invoice_settings' in customer
        ? customer.invoice_settings?.default_payment_method
        : null;

      // Format payment methods
      const formattedMethods = paymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year
        } : null,
        is_default: pm.id === defaultPaymentMethodId
      }));

      // Update local cache
      await supabaseService
        .from('payment_methods')
        .delete()
        .eq('user_id', user.id);

      if (formattedMethods.length > 0) {
        await supabaseService
          .from('payment_methods')
          .insert(
            formattedMethods.map(pm => ({
              user_id: user.id,
              stripe_payment_method_id: pm.id,
              type: pm.type,
              card_brand: pm.card?.brand,
              card_last4: pm.card?.last4,
              card_exp_month: pm.card?.exp_month,
              card_exp_year: pm.card?.exp_year,
              is_default: pm.is_default
            }))
          );
      }

      return new Response(JSON.stringify({ paymentMethods: formattedMethods }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, paymentMethodId } = body;

      if (action === 'create_setup_intent') {
        // Create SetupIntent for adding new payment method
        const setupIntent = await stripe.setupIntents.create({
          customer: stripeCustomerId,
          usage: 'off_session',
          payment_method_types: ['card']
        });

        console.log('[PAYMENT-METHODS] Created SetupIntent:', setupIntent.id);

        return new Response(JSON.stringify({ 
          clientSecret: setupIntent.client_secret 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'set_default' && paymentMethodId) {
        // Set payment method as default
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });

        // Update local cache
        await supabaseService
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', user.id);

        await supabaseService
          .from('payment_methods')
          .update({ is_default: true })
          .eq('user_id', user.id)
          .eq('stripe_payment_method_id', paymentMethodId);

        console.log('[PAYMENT-METHODS] Set default payment method:', paymentMethodId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'delete' && paymentMethodId) {
        // Detach payment method
        await stripe.paymentMethods.detach(paymentMethodId);

        // Remove from local cache
        await supabaseService
          .from('payment_methods')
          .delete()
          .eq('user_id', user.id)
          .eq('stripe_payment_method_id', paymentMethodId);

        console.log('[PAYMENT-METHODS] Deleted payment method:', paymentMethodId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error('Invalid request');

  } catch (error) {
    console.error('[PAYMENT-METHODS] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});