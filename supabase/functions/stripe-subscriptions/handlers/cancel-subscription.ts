import { corsHeaders } from '../utils/cors.ts';

export async function handleCancelSubscription(
  stripe,
  supabaseService,
  user,
  subscriptionId,
  immediate = false
) {
  console.log('=== CANCEL SUBSCRIPTION HANDLER START ===');
  console.log('Cancelling subscription:', subscriptionId);
  console.log('Immediate flag received:', immediate, 'type:', typeof immediate);
  console.log('User ID:', user?.id);

  // Validate input early
  if (!subscriptionId || !user?.id) {
    console.error('Missing subscriptionId or user ID');
    return new Response(JSON.stringify({
      error: 'Missing subscription ID or user authentication',
    }), {
      headers: corsHeaders,
      status: 400,
    });
  }

  try {
    // 1. Look up user subscription in Supabase
    const { data: userSubscription, error: findError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .single();

    if (findError || !userSubscription) {
      console.error('Subscription not found:', findError || 'No matching record');
      return new Response(JSON.stringify({
        error: 'Subscription not found',
      }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    // 2. Decide cancellation type
    const isImmediate = immediate === true || immediate === 'true' || immediate === 1;

    if (isImmediate) {
      // === IMMEDIATE CANCELLATION ===
      console.log('=== EXECUTING IMMEDIATE CANCELLATION ===');

      let cancelledSubscription;
      try {
        cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);
      } catch (stripeError) {
        console.error('Stripe immediate cancel error:', stripeError);
        return new Response(JSON.stringify({
          error: stripeError?.message || 'Stripe cancellation failed',
        }), {
          headers: corsHeaders,
          status: stripeError?.statusCode || 502,
        });
      }

      console.log('Cancelled subscription:', cancelledSubscription.id);

      const { error: deleteError } = await supabaseService
        .from('user_subscriptions')
        .delete()
        .eq('id', userSubscription.id);

      if (deleteError) {
        console.error('Error deleting user subscription:', deleteError);
        return new Response(JSON.stringify({
          error: 'Database deletion failed',
        }), {
          headers: corsHeaders,
          status: 500,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Subscription cancelled immediately',
        status: 'canceled',
        canceled_at: cancelledSubscription.canceled_at,
      }), {
        headers: corsHeaders,
        status: 200,
      });

    } else {
      // === DELAYED CANCELLATION ===
      console.log('=== EXECUTING DELAYED CANCELLATION ===');

      let updatedSubscription;
      try {
        updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        console.error('Stripe delayed cancel error:', stripeError);
        return new Response(JSON.stringify({
          error: stripeError?.message || 'Stripe update failed',
        }), {
          headers: corsHeaders,
          status: stripeError?.statusCode || 502,
        });
      }

      const updateData = {
        cancel_at_period_end: true,
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabaseService
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', userSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return new Response(JSON.stringify({
          error: 'Database update failed',
        }), {
          headers: corsHeaders,
          status: 500,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Subscription will cancel at period end',
        status: 'active',
        cancel_at: updatedSubscription.current_period_end * 1000,
      }), {
        headers: corsHeaders,
        status: 200,
      });
    }

  } catch (error) {
    console.error('Unexpected cancel subscription error:', error);
    return new Response(JSON.stringify({
      error: error?.message || 'An unexpected error occurred',
      stack: error?.stack || null,
    }), {
      headers: corsHeaders,
      status: 500,
    });
  }
}
