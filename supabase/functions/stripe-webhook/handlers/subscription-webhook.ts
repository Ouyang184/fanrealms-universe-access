
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleSubscriptionWebhook(
  event: any,
  supabaseService: any
) {
  console.log('=== PROCESSING SUBSCRIPTION WEBHOOK ===');
  console.log('Event type:', event.type, 'ID:', event.id);

  const subscription = event.data.object;
  console.log('Subscription data:', {
    id: subscription.id,
    status: subscription.status,
    customer: subscription.customer,
    metadata: subscription.metadata
  });

  if (event.type === 'customer.subscription.created' || 
      event.type === 'customer.subscription.updated') {
    
    console.log('Processing subscription created/updated:', subscription.id);

    // Extract metadata
    const { user_id, creator_id, tier_id } = subscription.metadata || {};
    
    if (!user_id || !creator_id || !tier_id) {
      console.error('Missing metadata in subscription:', subscription.metadata);
      return;
    }

    const currentPeriodStart = subscription.current_period_start ? 
      new Date(subscription.current_period_start * 1000).toISOString() : null;
    const currentPeriodEnd = subscription.current_period_end ? 
      new Date(subscription.current_period_end * 1000).toISOString() : null;

    // Determine status based on Stripe subscription status
    let dbStatus = 'pending';
    if (subscription.status === 'active') {
      dbStatus = 'active';
    } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      dbStatus = 'canceled';
    }

    console.log('Updating subscription with status:', dbStatus);

    // Update or create subscription record in user_subscriptions
    const { error: upsertError } = await supabaseService
      .from('user_subscriptions')
      .upsert({
        user_id,
        creator_id,
        tier_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: dbStatus,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        amount: subscription.items?.data?.[0]?.price?.unit_amount ? 
          subscription.items.data[0].price.unit_amount / 100 : 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_subscription_id'
      });

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
    } else {
      console.log('Successfully updated subscription:', subscription.id);
    }

    // Clean up any old records for the same user/creator/tier combination
    if (dbStatus === 'active') {
      const { error: cleanupError } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user_id)
        .eq('creator_id', creator_id)
        .eq('tier_id', tier_id)
        .neq('stripe_subscription_id', subscription.id);

      if (cleanupError) {
        console.error('Error cleaning up old subscriptions:', cleanupError);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    console.log('Processing subscription deleted:', subscription.id);

    // Update subscription status to canceled
    const { error: deleteError } = await supabaseService
      .from('user_subscriptions')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (deleteError) {
      console.error('Error updating canceled subscription:', deleteError);
    } else {
      console.log('Successfully marked subscription as canceled:', subscription.id);
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    console.log('Processing payment succeeded for subscription:', subscription.id);

    // Ensure subscription is marked as active when payment succeeds
    const { error: activateError } = await supabaseService
      .from('user_subscriptions')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (activateError) {
      console.error('Error activating subscription after payment:', activateError);
    } else {
      console.log('Successfully activated subscription after payment:', subscription.id);
    }
  }

  console.log('=== SUBSCRIPTION WEBHOOK PROCESSING COMPLETE ===');
}
