
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = (await import('https://esm.sh/stripe@14.21.0')).default(
  Deno.env.get('STRIPE_SECRET_KEY') || ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== WEBHOOK EVENT RECEIVED ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('stripe-signature')!;

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', { status: 400 });
    }

    console.log('Webhook event type:', event.type, 'ID:', event.id);

    if (event.type === 'invoice.payment_succeeded') {
      console.log('=== PROCESSING INVOICE PAYMENT SUCCEEDED ===');
      
      const invoice = event.data.object as any;
      console.log('Processing invoice payment succeeded:', invoice.id);

      let subscriptionId = invoice.subscription;
      
      // Try to get subscription ID from different sources
      if (!subscriptionId && invoice.subscription_details?.metadata?.subscription_id) {
        subscriptionId = invoice.subscription_details.metadata.subscription_id;
        console.log('Found subscription ID in subscription_details metadata:', subscriptionId);
      }
      
      if (!subscriptionId && invoice.lines?.data?.[0]?.subscription) {
        subscriptionId = invoice.lines.data[0].subscription;
        console.log('Found subscription ID in line items:', subscriptionId);
      }

      if (subscriptionId) {
        console.log('Found subscription ID:', subscriptionId);
        
        const amountPaid = invoice.amount_paid / 100;
        const platformFee = amountPaid * 0.05;
        const creatorEarnings = amountPaid - platformFee;
        
        console.log('Payment details:', { amountPaid, platformFee, creatorEarnings });

        // CRITICAL: Update subscription status to 'active' when payment succeeds
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (updateError) {
          console.error('Error updating subscription status to active:', updateError);
        } else {
          console.log('Successfully activated subscription:', subscriptionId);
        }

        // Record the payment in creator_earnings
        const { error: earningsError } = await supabase
          .from('creator_earnings')
          .insert({
            creator_id: invoice.metadata?.creator_id,
            subscription_id: subscriptionId,
            amount: amountPaid,
            platform_fee: platformFee,
            net_amount: creatorEarnings,
            payment_date: new Date().toISOString()
          });

        if (earningsError) {
          console.error('Error recording creator earnings:', earningsError);
        }
      } else {
        console.error('No subscription ID found in invoice');
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      console.log('=== PROCESSING SUBSCRIPTION CREATED/UPDATED ===');
      
      const subscription = event.data.object as any;
      console.log('Processing subscription created/updated:', subscription.id, 'status:', subscription.status);

      const currentPeriodStart = subscription.current_period_start ? 
        new Date(subscription.current_period_start * 1000).toISOString() : null;
      const currentPeriodEnd = subscription.current_period_end ? 
        new Date(subscription.current_period_end * 1000).toISOString() : null;

      console.log('Updating subscription periods:', { currentPeriodStart, currentPeriodEnd });

      // Update subscription with period information
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .update({
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          // Only set to active if the subscription status is active AND not incomplete
          status: subscription.status === 'active' ? 'active' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (subscriptionError) {
        console.error('Error updating subscription periods:', subscriptionError);
      } else {
        console.log('Successfully updated subscription periods for:', subscription.id);
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      console.log('=== PROCESSING PAYMENT INTENT SUCCEEDED ===');
      
      const paymentIntent = event.data.object as any;
      console.log('Processing payment intent succeeded:', paymentIntent.id);
      console.log('Payment intent succeeded for amount:', paymentIntent.amount / 100);

      // Get the subscription from the invoice if it exists
      if (paymentIntent.invoice) {
        try {
          const invoice = await stripe.invoices.retrieve(paymentIntent.invoice);
          if (invoice.subscription) {
            console.log('Activating subscription from payment intent:', invoice.subscription);
            
            // Ensure subscription is activated
            const { error: activateError } = await supabase
              .from('user_subscriptions')
              .update({ 
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('stripe_subscription_id', invoice.subscription);

            if (activateError) {
              console.error('Error activating subscription from payment intent:', activateError);
            } else {
              console.log('Successfully activated subscription from payment intent');
            }
          }
        } catch (invoiceError) {
          console.error('Error retrieving invoice from payment intent:', invoiceError);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      console.log('=== PROCESSING SUBSCRIPTION DELETED ===');
      
      const subscription = event.data.object as any;
      console.log('Processing subscription deleted:', subscription.id);

      // Remove subscription from database
      const { error: deleteError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('stripe_subscription_id', subscription.id);

      if (deleteError) {
        console.error('Error deleting subscription:', deleteError);
      } else {
        console.log('Successfully deleted subscription:', subscription.id);
      }
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500, headers: corsHeaders });
  }
});
