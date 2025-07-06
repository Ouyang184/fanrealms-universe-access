
export async function handlePaymentIntentWebhook(event: any, supabase: any, stripe: any) {
  console.log('Processing payment intent webhook (SUBSCRIPTION - LIVE MODE):', event.type);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('Payment intent succeeded for subscription (LIVE MODE):', paymentIntent.id);

      // Handle subscription payment success
      if (paymentIntent.metadata?.subscription_id) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', paymentIntent.metadata.subscription_id);

        if (error) {
          console.error('Failed to activate subscription after payment intent (LIVE MODE):', error);
        }
      }
    }
  } catch (error) {
    console.error('Error handling payment intent webhook (SUBSCRIPTION - LIVE MODE):', error);
    throw error;
  }
}
