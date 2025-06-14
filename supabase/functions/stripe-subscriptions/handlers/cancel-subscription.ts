import { corsHeaders } from '../utils/cors.ts';

export async function handleCancelSubscription(stripe: any, supabaseService: any, user: any, subscriptionId: string, immediate: boolean = false) {
  console.log('=== CANCEL SUBSCRIPTION HANDLER START ===');
  console.log('Cancelling subscription:', subscriptionId);
  console.log('Immediate flag received:', immediate, 'type:', typeof immediate);
  console.log('User ID:', user.id);
  
  try {
    // Find the subscription in our database first
    const { data: userSubscription, error: findError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (findError) {
      console.error('Error finding user subscription:', findError);
      throw new Error('Subscription not found');
    }

    console.log('Found user subscription to cancel:', userSubscription.id);
    console.log('Proceeding with immediate cancellation check. Immediate:', immediate);

    // CRITICAL: Check for immediate cancellation with explicit boolean check
    if (immediate === true) {
      console.log('=== EXECUTING IMMEDIATE CANCELLATION ===');
      console.log('Calling stripe.subscriptions.cancel for:', subscriptionId);
      
      // IMMEDIATE CANCELLATION - Cancel the subscription in Stripe completely
      const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      
      console.log('Stripe subscription cancelled immediately. Status:', cancelledSubscription.status);
      console.log('Cancelled subscription details:', {
        id: cancelledSubscription.id,
        status: cancelledSubscription.status,
        canceled_at: cancelledSubscription.canceled_at
      });
      
      // For immediate cancellation, delete from our database completely
      console.log('Deleting subscription record from database for immediate cancellation');
      const { error: deleteError } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('id', userSubscription.id);

      if (deleteError) {
        console.error('Error deleting user subscription:', deleteError);
        throw deleteError;
      }

      console.log('User subscription deleted successfully for immediate cancellation');
      
      const response = {
        success: true,
        message: 'Subscription cancelled immediately',
        immediate: true,
        status: 'canceled'
      };
      
      console.log('Returning immediate cancellation response:', response);
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
      
    } else {
      console.log('=== EXECUTING DELAYED CANCELLATION ===');
      console.log('Setting Stripe subscription to cancel at period end:', subscriptionId);
      
      // DELAYED CANCELLATION - Set the Stripe subscription to cancel at period end
      const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      console.log('Stripe subscription set to cancel at period end. Status:', cancelledSubscription.status);
      console.log('Period end timestamp:', cancelledSubscription.current_period_end);

      // Update our database - keep status as 'active' but add cancel info
      const updateData = {
        cancel_at_period_end: true,
        current_period_end: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating database with delayed cancellation data:', updateData);

      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', userSubscription.id);

      if (updateError) {
        console.error('Error updating user subscription status:', updateError);
        throw updateError;
      }

      console.log('User subscription updated successfully with delayed cancellation');
      
      const responseData = { 
        success: true,
        message: 'Subscription will cancel at period end',
        immediate: false,
        status: 'active'
      };

      if (cancelledSubscription.current_period_end) {
        responseData.cancelAt = cancelledSubscription.current_period_end * 1000;
      }
      
      console.log('Returning delayed cancellation response:', responseData);
      
      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to cancel subscription' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
