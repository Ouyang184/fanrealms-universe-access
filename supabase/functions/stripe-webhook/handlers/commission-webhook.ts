
export async function handleCommissionWebhook(event: any, supabase: any) {
  console.log('Processing commission webhook:', event.type);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const commissionId = session.metadata?.commission_request_id;

      if (commissionId && session.metadata?.type === 'commission_payment') {
        console.log('Checkout session completed for commission:', commissionId);

        // Update commission status to payment authorized (not captured yet)
        const { error } = await supabase
          .from('commission_requests')
          .update({ 
            status: 'payment_authorized',
            stripe_payment_intent_id: session.payment_intent, // Now store the actual payment intent ID
            creator_notes: 'Payment authorized - awaiting creator acceptance'
          })
          .eq('id', commissionId);

        if (error) {
          console.error('Failed to update commission on checkout completion:', error);
        } else {
          console.log('Commission marked as payment authorized');
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

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const commissionId = paymentIntent.metadata?.commission_request_id;

      if (commissionId && paymentIntent.metadata?.type === 'commission_payment') {
        console.log('Payment intent succeeded for commission:', commissionId);

        // Update commission status to paid/accepted
        const { error } = await supabase
          .from('commission_requests')
          .update({ 
            status: 'accepted',
            creator_notes: 'Payment captured - commission accepted'
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Failed to update commission on payment success:', error);
        } else {
          console.log('Commission marked as accepted due to payment success');
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
