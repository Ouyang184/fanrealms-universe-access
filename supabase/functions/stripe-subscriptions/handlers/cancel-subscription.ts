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

    let cancelledSubscription;
    let updateData;

    if (immediate) {
      // Cancel immediately - delete the subscription from Stripe
      console.log('Cancelling subscription immediately:', subscriptionId);
      cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      
      // Update our database to reflect immediate cancellation
      updateData = {
        status: 'canceled',
        cancel_at_period_end: false,
        current_period_end: null,
        cancel_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Stripe subscription cancelled immediately');
    } else {
      // Set the Stripe subscription to cancel at period end
      console.log('Setting Stripe subscription to cancel at period end:', subscriptionId);
      cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      // Update our database - keep status as active but add cancel info
      updateData = {
        // Keep status as active since subscription is still active until period end
        cancel_at_period_end: true,
        current_period_end: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Stripe subscription set to cancel at period end successfully');
    }

    const { error: updateError } = await supabaseService
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', userSubscription.id);

    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
      throw updateError;
    }

    console.log('User subscription updated successfully');
    
    const responseData = { 
      success: true,
      message: immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end'
    };

    if (!immediate && cancelledSubscription.current_period_end) {
      responseData.cancelAt = cancelledSubscription.current_period_end * 1000; // Return as milliseconds
    }
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

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
