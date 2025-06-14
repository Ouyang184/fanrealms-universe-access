import { corsHeaders } from '../utils/cors.ts';

export async function handleCancelSubscription(stripe: any, supabaseService: any, user: any, subscriptionId: string, immediate: boolean = false) {
  console.log('Cancelling subscription:', subscriptionId, 'Immediate:', immediate);
  
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

    if (immediate === true) {
      // IMMEDIATE CANCELLATION - Cancel the subscription in Stripe completely
      console.log('IMMEDIATE CANCELLATION: Cancelling subscription immediately in Stripe:', subscriptionId);
      const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      
      console.log('Stripe subscription cancelled immediately, status:', cancelledSubscription.status);
      
      // For immediate cancellation, delete from our database completely
      const { error: deleteError } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('id', userSubscription.id);

      if (deleteError) {
        console.error('Error deleting user subscription:', deleteError);
        throw deleteError;
      }

      console.log('User subscription deleted successfully for immediate cancellation');
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Subscription cancelled immediately',
        immediate: true,
        status: 'canceled'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // DELAYED CANCELLATION - Set the Stripe subscription to cancel at period end
      console.log('DELAYED CANCELLATION: Setting Stripe subscription to cancel at period end:', subscriptionId);
      const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      // Update our database - keep status as 'active' but add cancel info
      const updateData = {
        cancel_at_period_end: true,
        current_period_end: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Stripe subscription set to cancel at period end successfully');

      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', userSubscription.id);

      if (updateError) {
        console.error('Error updating user subscription status:', updateError);
        throw updateError;
      }

      console.log('User subscription updated successfully with status: active (cancel at period end)');
      
      const responseData = { 
        success: true,
        message: 'Subscription will cancel at period end',
        immediate: false,
        status: 'active'
      };

      if (cancelledSubscription.current_period_end) {
        responseData.cancelAt = cancelledSubscription.current_period_end * 1000;
      }
      
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
