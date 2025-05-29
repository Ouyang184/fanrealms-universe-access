import { corsHeaders } from '../utils/cors.ts';

export async function handleCancelSubscription(stripe: any, supabaseService: any, user: any, subscriptionId: string) {
  console.log('Cancelling subscription:', subscriptionId);
  
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

    // Set the Stripe subscription to cancel at period end
    console.log('Setting Stripe subscription to cancel at period end:', subscriptionId);
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    console.log('Stripe subscription set to cancel at period end successfully');

    // Update our database - keep status as 'active' but add cancel info
    const { error: updateError } = await supabaseService
      .from('user_subscriptions')
      .update({
        // Keep status as active since subscription is still active until period end
        current_period_end: new Date(cancelledSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userSubscription.id);

    if (updateError) {
      console.error('Error updating user subscription status:', updateError);
      throw updateError;
    }

    console.log('User subscription updated successfully');
    
    return new Response(JSON.stringify({ 
      success: true,
      cancelAt: cancelledSubscription.current_period_end * 1000, // Return as milliseconds
      message: 'Subscription will cancel at period end'
    }), {
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
