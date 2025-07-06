
export async function handleSubscriptionWebhook(event: any, supabase: any, stripe: any) {
  console.log('Processing subscription webhook (LIVE MODE):', event.type);

  try {
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object;
      console.log('Subscription created (LIVE MODE):', subscription.id);

      // Update subscription status in database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to update subscription on creation (LIVE MODE):', error);
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      console.log('Subscription updated (LIVE MODE):', subscription.id);

      // Update subscription status in database
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to update subscription (LIVE MODE):', error);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      console.log('Subscription deleted (LIVE MODE):', subscription.id);

      // Update subscription status to cancelled
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          current_period_end: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Failed to update subscription on deletion (LIVE MODE):', error);
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      console.log('Invoice payment succeeded (LIVE MODE):', invoice.id);

      // Update subscription status to active if it was pending
      if (invoice.subscription) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', invoice.subscription)
          .eq('status', 'incomplete');

        if (error) {
          console.error('Failed to activate subscription after payment (LIVE MODE):', error);
        }
      }
    }

  } catch (error) {
    console.error('Error handling subscription webhook (LIVE MODE):', error);
    throw error;
  }
}
