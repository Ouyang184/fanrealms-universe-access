
export async function handleCheckoutWebhook(event: any, supabase: any, stripe: any) {
  console.log('Processing checkout webhook (SUBSCRIPTION - LIVE MODE):', event.type);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout session completed (SUBSCRIPTION - LIVE MODE):', session.id);

      if (session.mode === 'subscription') {
        // Update subscription status to active
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', session.subscription);

        if (error) {
          console.error('Failed to activate subscription after checkout (LIVE MODE):', error);
        } else {
          console.log('Subscription activated after checkout (LIVE MODE):', session.subscription);
        }
      }
    }
  } catch (error) {
    console.error('Error handling checkout webhook (SUBSCRIPTION - LIVE MODE):', error);
    throw error;
  }
}
