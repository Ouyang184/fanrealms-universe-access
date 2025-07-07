
export async function handleCommissionWebhook(event: any, supabase: any) {
  console.log('Processing commission webhook:', event.type);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const commissionId = session.metadata?.commission_request_id;

      if (commissionId && session.metadata?.type === 'commission_payment') {
        console.log('Checkout session completed for commission:', commissionId);

        // For standard payments, mark as accepted immediately since payment is captured
        const { error } = await supabase
          .from('commission_requests')
          .update({ 
            status: 'accepted',
            stripe_payment_intent_id: session.payment_intent,
            creator_notes: 'Payment completed successfully - commission accepted'
          })
          .eq('id', commissionId);

        if (error) {
          console.error('Failed to update commission on checkout completion:', error);
        } else {
          console.log('Commission marked as accepted after successful payment');
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const commissionId = paymentIntent.metadata?.commission_request_id;

      if (commissionId && paymentIntent.metadata?.type === 'commission_payment') {
        console.log('Payment intent failed for commission:', commissionId);

        // Update commission status to failed
        const { error } = await supabase
          .from('commission_requests')
          .update({ 
            status: 'payment_failed',
            creator_notes: 'Payment failed - please try again'
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Failed to update commission on payment failure:', error);
        } else {
          console.log('Commission marked as payment failed');
        }
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;

      // Find commission by payment intent ID
      const { data: commissionRequest, error: fetchError } = await supabase
        .from('commission_requests')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (fetchError) {
        console.log('No commission found for refunded charge:', paymentIntentId);
        return;
      }

      console.log('Charge refunded for commission:', commissionRequest.id);

      // Update commission status to refunded
      const { error } = await supabase
        .from('commission_requests')
        .update({ 
          status: 'refunded',
          creator_notes: 'Payment refunded'
        })
        .eq('id', commissionRequest.id);

      if (error) {
        console.error('Failed to update commission on refund:', error);
      } else {
        console.log('Commission marked as refunded');
      }
    }

  } catch (error) {
    console.error('Error handling commission webhook:', error);
    throw error;
  }
}
