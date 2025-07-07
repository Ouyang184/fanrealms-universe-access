import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createJsonResponse } from '../utils/cors.ts';

export async function handleVerifyCheckoutSession(
  stripe: any,
  supabase: any,
  user: any,
  body: any
) {
  console.log('Verifying checkout session for user:', user.id);
  console.log('Request body:', JSON.stringify(body, null, 2));

  const sessionId = body.session_id;

  if (!sessionId) {
    console.log('ERROR: Missing session_id');
    return createJsonResponse({ error: 'Missing session_id' }, 400);
  }

  try {
    // Retrieve the checkout session from Stripe
    console.log('Retrieving checkout session:', sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'payment_intent']
    });

    console.log('Checkout session retrieved:', session.id, 'Status:', session.payment_status);

    if (session.payment_status !== 'paid') {
      console.log('Payment not completed yet:', session.payment_status);
      return createJsonResponse({ 
        error: 'Payment not completed',
        status: session.payment_status 
      }, 400);
    }

    // Extract metadata
    const metadata = session.metadata || {};
    const isUpgrade = metadata.is_upgrade === 'true';
    
    console.log('Session metadata:', metadata);
    console.log('Is upgrade:', isUpgrade);

    // Create service client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (isUpgrade) {
      // Handle subscription upgrade
      console.log('Processing subscription upgrade...');
      
      // Update existing subscription to new tier
      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update({
          tier_id: metadata.tier_id,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', metadata.existing_subscription_id);

      if (updateError) {
        console.error('Error updating subscription for upgrade:', updateError);
        throw updateError;
      }

      // Update the Stripe subscription to the new tier
      try {
        const subscription = await stripe.subscriptions.update(metadata.existing_subscription_id, {
          items: [{
            id: (await stripe.subscriptions.retrieve(metadata.existing_subscription_id)).items.data[0].id,
            price: metadata.tier_id, // This should be the stripe_price_id
          }],
          proration_behavior: 'none', // We handled proration with the one-time payment
        });
        
        console.log('Stripe subscription updated for upgrade:', subscription.id);
      } catch (stripeError) {
        console.error('Error updating Stripe subscription:', stripeError);
        // Continue anyway as the database was updated
      }

      console.log('Subscription upgrade processed successfully');

    } else {
      // Handle new subscription creation
      console.log('Processing new subscription...');
      
      if (session.subscription) {
        const subscription = session.subscription;
        
        // Create subscription record in database
        const subscriptionData = {
          user_id: user.id,
          creator_id: metadata.creator_id,
          tier_id: metadata.tier_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer,
          status: subscription.status === 'active' ? 'active' : subscription.status,
          amount: subscription.items.data[0].price.unit_amount / 100, // Convert from cents
          current_period_start: subscription.current_period_start ? 
            new Date(subscription.current_period_start * 1000).toISOString() : null,
          current_period_end: subscription.current_period_end ? 
            new Date(subscription.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('Creating subscription record:', subscriptionData);

        const { error: insertError } = await supabaseService
          .from('user_subscriptions')
          .insert(subscriptionData);

        if (insertError) {
          console.error('Error creating subscription record:', insertError);
          throw insertError;
        }

        console.log('New subscription created successfully');
      }
    }

    // Clean up legacy subscriptions table
    await supabaseService
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('creator_id', metadata.creator_id);

    return createJsonResponse({
      success: true,
      tierName: metadata.tier_name,
      creatorName: metadata.creator_name,
      creatorId: metadata.creator_id,
      isUpgrade: isUpgrade,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error verifying checkout session:', error);
    return createJsonResponse({ 
      error: 'Failed to verify payment session' 
    }, 500);
  }
}