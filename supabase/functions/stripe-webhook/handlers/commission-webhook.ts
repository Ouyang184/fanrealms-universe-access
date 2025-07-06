
export async function handleCommissionWebhook(event: any, supabase: any) {
  console.log('Processing commission webhook:', event.type);

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const commissionId = paymentIntent.metadata?.commission_request_id;

      if (commissionId && paymentIntent.metadata?.type === 'commission_payment') {
        console.log('Payment intent succeeded for commission (AUTHORIZATION):', commissionId);

        // For manual capture, payment_intent.succeeded means authorization succeeded
        // Update commission status to payment_authorized (funds are held, awaiting creator decision)
        const { error } = await supabase
          .from('commission_requests')
          .update({ 
            status: 'payment_authorized',
            stripe_payment_intent_id: paymentIntent.id,
            creator_notes: 'Payment authorized successfully - funds held pending your approval (TEST MODE)'
          })
          .eq('id', commissionId);

        if (error) {
          console.error('Failed to update commission on payment authorization:', error);
        } else {
          console.log('Commission marked as payment_authorized - funds held for creator approval');
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
            creator_notes: 'Payment authorization failed - please try again (TEST MODE)'
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Failed to update commission on payment failure:', error);
        } else {
          console.log('Commission marked as payment failed');
        }
      }
    }

    if (event.type === 'payment_intent.canceled') {
      const paymentIntent = event.data.object;
      const commissionId = paymentIntent.metadata?.commission_request_id;

      if (commissionId && paymentIntent.metadata?.type === 'commission_payment') {
        console.log('Payment intent canceled for commission:', commissionId);

        // Update commission status back to pending
        const { error } = await supabase
          .from('commission_requests')
          .update({ 
            status: 'rejected',
            stripe_payment_intent_id: paymentIntent.id,
            creator_notes: 'Commission rejected - payment authorization canceled (TEST MODE)'
          })
          .eq('id', commissionId);

        if (error) {
          console.error('Failed to update commission on payment cancellation:', error);
        } else {
          console.log('Commission marked as rejected after payment cancellation');
        }
      }
    }

    // Handle charge.captured for when creator accepts and payment is captured
    if (event.type === 'charge.captured') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;

      // Find commission by payment intent ID
      const { data: commissionRequest, error: fetchError } = await supabase
        .from('commission_requests')
        .select('id, creator_id, agreed_price')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (fetchError) {
        console.log('No commission found for captured charge:', paymentIntentId);
        return;
      }

      console.log('Charge captured for commission:', commissionRequest.id);

      // Update commission status to accepted (payment fully processed)
      const { error: updateError } = await supabase
        .from('commission_requests')
        .update({ 
          status: 'accepted',
          creator_notes: 'Commission accepted and payment captured successfully (TEST MODE)'
        })
        .eq('id', commissionRequest.id);

      if (updateError) {
        console.error('Failed to update commission on charge capture:', updateError);
        return;
      }

      // Record the commission earning
      const amount = charge.amount / 100; // Convert from cents
      const platformFee = amount * 0.04; // 4% for commissions
      const netAmount = amount - platformFee;

      const { error: earningError } = await supabase
        .from('creator_earnings')
        .insert({
          creator_id: commissionRequest.creator_id,
          commission_id: commissionRequest.id,
          amount: amount,
          platform_fee: platformFee,
          net_amount: netAmount,
          stripe_transfer_id: charge.id,
          payment_date: new Date().toISOString(),
          earning_type: 'commission'
        });

      if (earningError) {
        console.error('Failed to record commission earning:', earningError);
      } else {
        console.log('Commission earning recorded successfully');
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
          creator_notes: 'Payment refunded (TEST MODE)'
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
