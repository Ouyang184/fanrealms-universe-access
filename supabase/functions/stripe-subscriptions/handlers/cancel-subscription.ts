
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
    // 1. Look up user subscription in Supabase - handle both cases
    let userSubscription;
    let findError;

    // First try to find by stripe_subscription_id
    const { data: subscriptionByStripeId, error: stripeIdError } = await supabaseService
      .from('user_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (subscriptionByStripeId) {
      userSubscription = subscriptionByStripeId;
      console.log('Found subscription by Stripe ID');
    } else {
      console.log('No subscription found by Stripe ID, trying fallback lookup...');
      
      // Fallback: treat subscriptionId as our internal subscription ID
      const { data: subscriptionById, error: internalIdError } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionById) {
        userSubscription = subscriptionById;
        console.log('Found subscription by internal ID');
      } else {
        findError = internalIdError || 'No active subscription found';
      }
    }

    if (!userSubscription) {
      console.error('Subscription not found:', findError || 'No matching record');
      return new Response(JSON.stringify({
        error: 'Subscription not found',
      }), {
        headers: corsHeaders,
        status: 404,
      });
    }

    console.log('Found subscription:', {
      id: userSubscription.id,
      stripe_subscription_id: userSubscription.stripe_subscription_id,
      creator_id: userSubscription.creator_id,
      tier_id: userSubscription.tier_id
    });

    // 2. Decide cancellation type
    const isImmediate = immediate === true || immediate === 'true' || immediate === 1;

    if (isImmediate) {
      // === IMMEDIATE CANCELLATION ===
      console.log('=== EXECUTING IMMEDIATE CANCELLATION ===');

      let cancelledSubscription = null;
      
      // Only try to cancel in Stripe if we have a Stripe subscription ID
      if (userSubscription.stripe_subscription_id) {
        try {
          console.log('Cancelling Stripe subscription:', userSubscription.stripe_subscription_id);
          cancelledSubscription = await stripe.subscriptions.cancel(userSubscription.stripe_subscription_id);
          console.log('Successfully cancelled Stripe subscription');
        } catch (stripeError) {
          console.error('Stripe immediate cancel error:', stripeError);
          // For immediate cancellation, we'll still proceed to delete from database
          // even if Stripe cancellation fails
          console.log('Stripe cancellation failed, but proceeding with database deletion for immediate cancellation');
        }
      } else {
        console.log('No Stripe subscription ID found, proceeding with database-only cancellation');
      }

      // Delete from our database for immediate cancellation
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

      console.log('Successfully deleted subscription from database');

      return new Response(JSON.stringify({
        success: true,
        message: 'Subscription cancelled immediately',
        status: 'canceled',
        canceled_at: cancelledSubscription?.canceled_at || Math.floor(Date.now() / 1000),
        immediate: true
      }), {
        headers: corsHeaders,
        status: 200,
      });

    } else {
      // === DELAYED CANCELLATION ===
      console.log('=== EXECUTING DELAYED CANCELLATION ===');

      let updatedSubscription = null;
      let currentPeriodEnd = userSubscription.current_period_end;

      // Only try to update in Stripe if we have a Stripe subscription ID
      if (userSubscription.stripe_subscription_id) {
        try {
          console.log('Updating Stripe subscription for delayed cancellation:', userSubscription.stripe_subscription_id);
          updatedSubscription = await stripe.subscriptions.update(userSubscription.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
          currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000).toISOString();
          console.log('Successfully updated Stripe subscription');
        } catch (stripeError) {
          console.error('Stripe delayed cancel error:', stripeError);
          return new Response(JSON.stringify({
            error: stripeError?.message || 'Stripe update failed',
          }), {
            headers: corsHeaders,
            status: stripeError?.statusCode || 502,
          });
        }
      } else {
        console.log('No Stripe subscription ID found, updating local subscription only');
        // For subscriptions without Stripe IDs, use the existing period end or default to 30 days
        if (!currentPeriodEnd) {
          currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      const updateData = {
        cancel_at_period_end: true,
        current_period_end: currentPeriodEnd,
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

      const cancelAt = updatedSubscription ? 
        updatedSubscription.current_period_end * 1000 : 
        new Date(currentPeriodEnd).getTime();

      return new Response(JSON.stringify({
        success: true,
        message: 'Subscription will cancel at period end',
        status: 'active',
        cancel_at: cancelAt,
        immediate: false
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
