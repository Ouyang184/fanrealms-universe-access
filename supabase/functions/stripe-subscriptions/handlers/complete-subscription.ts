
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleCompleteSubscription(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('Completing subscription for user:', user.id);
  console.log('Request body:', JSON.stringify(body, null, 2));

  const { setupIntentId } = body;

  if (!setupIntentId) {
    console.log('ERROR: Missing setupIntentId');
    return createJsonResponse({ error: 'Missing setupIntentId' }, 400);
  }

  // Create service client for database operations
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Retrieve the setup intent to get metadata
    console.log('Retrieving setup intent:', setupIntentId);
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      console.log('Setup intent not succeeded:', setupIntent.status);
      return createJsonResponse({ error: 'Setup intent not succeeded' }, 400);
    }

    const metadata = setupIntent.metadata;
    const {
      user_id,
      creator_id,
      tier_id,
      tier_name,
      creator_name,
      is_upgrade,
      existing_subscription_id,
      stripe_price_id,
      full_tier_price
    } = metadata;

    console.log('Setup intent metadata:', metadata);

    // Verify the user matches
    if (user_id !== user.id) {
      console.log('User ID mismatch');
      return createJsonResponse({ error: 'Unauthorized' }, 403);
    }

    // Get the payment method from the setup intent
    const paymentMethodId = setupIntent.payment_method;
    console.log('Payment method ID:', paymentMethodId);

    // Handle upgrade case - cancel existing subscription first
    if (is_upgrade === 'true' && existing_subscription_id) {
      console.log('Cancelling existing subscription for upgrade:', existing_subscription_id);
      try {
        await stripe.subscriptions.update(existing_subscription_id, {
          cancel_at_period_end: false,
          proration_behavior: 'always_invoice'
        });
        await stripe.subscriptions.cancel(existing_subscription_id, {
          prorate: true,
          invoice_now: true
        });
      } catch (error) {
        console.log('Error cancelling existing subscription:', error);
        // Continue anyway, the new subscription creation might still work
      }
    }

    // Create the actual subscription
    console.log('Creating Stripe subscription');
    const subscriptionData = {
      customer: setupIntent.customer,
      items: [{
        price: stripe_price_id
      }],
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: user_id,
        creator_id: creator_id,
        tier_id: tier_id,
        tier_name: tier_name,
        creator_name: creator_name
      }
    };

    // For upgrades, add proration settings
    if (is_upgrade === 'true') {
      subscriptionData.proration_behavior = 'always_invoice';
      subscriptionData.billing_cycle_anchor_config = {
        day_of_month: new Date().getDate()
      };
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);
    console.log('Subscription created:', subscription.id);

    // The webhook will handle database updates, but we can also do it here for immediate response
    const subscriptionRecord = {
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      amount: parseFloat(full_tier_price),
      creator_id: creator_id,
      tier_id: tier_id,
      user_id: user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert or update the subscription record
    const { error: upsertError } = await supabaseService
      .from('user_subscriptions')
      .upsert(subscriptionRecord, {
        onConflict: 'stripe_subscription_id'
      });

    if (upsertError) {
      console.error('Error upserting subscription record:', upsertError);
      // Don't fail the request, webhook will handle this
    }

    return createJsonResponse({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      message: 'Subscription created successfully'
    });

  } catch (error) {
    console.error('Error completing subscription:', error);
    return createJsonResponse({ 
      error: 'Failed to complete subscription. Please try again later.' 
    }, 500);
  }
}
