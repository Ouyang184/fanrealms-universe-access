
export async function handleCommissionWebhook(event: any, supabase: any) {
  console.log('Processing commission webhook:', event.type);
  console.log('Event data:', JSON.stringify(event.data?.object?.metadata || {}, null, 2));

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Session completed:', session.id);
      console.log('Session metadata:', session.metadata);
      console.log('Session payment_intent:', session.payment_intent);
      
      const commissionId = session.metadata?.commission_request_id;

      if (commissionId && session.metadata?.type === 'commission_payment') {
        console.log('Checkout session completed for commission:', commissionId);

        // Set to payment_pending - funds are authorized but awaiting creator acceptance
        // Store the actual payment intent ID, not the session ID
        const { error } = await supabase
          .from('commission_requests')
          .update({ 
            status: 'payment_pending',
            stripe_payment_intent_id: session.payment_intent, // This is the actual payment intent ID
            creator_notes: 'Payment completed successfully - awaiting creator acceptance'
          })
          .eq('id', commissionId);

        if (error) {
          console.error('Failed to update commission on checkout completion:', error);
        } else {
          console.log('Commission marked as payment_pending - awaiting creator acceptance');
        }
      } else {
        // Also try to find by checkout session ID in case metadata is missing
        console.log('No commission metadata found, trying to find by session ID:', session.id);
        
        const { data: commissionRequest, error: findError } = await supabase
          .from('commission_requests')
          .select('id')
          .eq('stripe_payment_intent_id', session.id)
          .single();

        if (!findError && commissionRequest) {
          console.log('Found commission by session ID:', commissionRequest.id);
          
          const { error: updateError } = await supabase
            .from('commission_requests')
            .update({ 
              status: 'payment_pending',
              stripe_payment_intent_id: session.payment_intent, // Store payment intent ID
              creator_notes: 'Payment completed successfully - awaiting creator acceptance'
            })
            .eq('id', commissionRequest.id);

          if (updateError) {
            console.error('Failed to update commission found by session ID:', updateError);
          } else {
            console.log('Commission updated to payment_pending via session ID lookup');
          }
        } else {
          console.log('No commission found for session:', session.id);
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
