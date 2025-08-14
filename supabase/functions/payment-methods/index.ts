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
      console.log('[PAYMENT-METHODS] Secure payment methods access for user:', user.id);

      // SECURITY ENHANCEMENT: Get payment methods from Stripe and update cache securely
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

      // Update local cache with service role (sensitive data stored securely)
      await supabaseService
        .from('payment_methods')
        .delete()
        .eq('user_id', user.id);

      if (paymentMethods.data.length > 0) {
        await supabaseService
          .from('payment_methods')
          .insert(
            paymentMethods.data.map(pm => ({
              user_id: user.id,
              stripe_payment_method_id: pm.id,
              type: pm.type,
              card_brand: pm.card?.brand,
              card_last4: pm.card?.last4,
              card_exp_month: pm.card?.exp_month,
              card_exp_year: pm.card?.exp_year,
              is_default: pm.id === defaultPaymentMethodId
            }))
          );
      }

      // CRITICAL: Return only secure, masked display data - NO sensitive information
      const { data: secureDisplayData, error: displayError } = await supabaseService
        .rpc('get_secure_payment_display', {
          p_user_id: user.id
        });

      if (displayError) {
        console.error('[PAYMENT-METHODS] Security function error:', displayError);
        throw new Error('Payment data access denied for security');
      }

      // Log secure access
      await supabaseService.rpc('log_secure_payment_access', {
        p_operation: 'EDGE_FUNCTION_SECURE_GET',
        p_user_id: user.id,
        p_metadata: {
          user_agent: req.headers.get('User-Agent'),
          ip_address: req.headers.get('CF-Connecting-IP') || 'unknown',
          timestamp: new Date().toISOString()
        }
      });

      // Return completely masked data - format compatible with existing frontend
      const maskedPaymentMethods = secureDisplayData.map(pm => ({
        id: pm.id,
        type: pm.card_type,
        card: pm.card_type !== pm.display_text ? {
          brand: pm.card_type,
          last4: '••••', // Completely masked
          exp_month: 12,  // Generic values
          exp_year: 2030
        } : null,
        is_default: pm.is_default,
        display_text: pm.display_text
      }));

      console.log('[PAYMENT-METHODS] Returning secure masked data for', maskedPaymentMethods.length, 'methods');

      return new Response(JSON.stringify({ 
        paymentMethods: maskedPaymentMethods,
        security_note: 'Data masked for security' 
      }), {
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