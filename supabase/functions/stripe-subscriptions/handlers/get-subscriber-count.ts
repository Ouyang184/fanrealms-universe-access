
import { createJsonResponse } from '../utils/cors.ts';

export async function handleGetSubscriberCount(
  stripe: any,
  supabaseService: any,
  tierId: string,
  creatorId: string
) {
  console.log('Getting subscriber count for tier:', tierId, 'creator:', creatorId);

  try {
    // Get all subscription records for this tier
    const { data: creatorSubs, error: creatorError } = await supabaseService
      .from('creator_subscriptions')
      .select('stripe_subscription_id')
      .eq('tier_id', tierId)
      .eq('creator_id', creatorId);

    if (creatorError) {
      console.error('Error fetching creator subscriptions:', creatorError);
    }

    // Verify each subscription with Stripe
    let activeCount = 0;
    const staleRecords = [];

    if (creatorSubs && creatorSubs.length > 0) {
      for (const sub of creatorSubs) {
        if (sub.stripe_subscription_id) {
          try {
            const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
            
            if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
              activeCount++;
            } else {
              // Mark for cleanup
              staleRecords.push(sub);
            }
          } catch (stripeError) {
            console.error('Stripe subscription not found:', sub.stripe_subscription_id);
            staleRecords.push(sub);
          }
        }
      }
    }

    // Clean up stale records
    for (const staleRecord of staleRecords) {
      console.log('Cleaning up stale subscription record for count:', staleRecord.stripe_subscription_id);
      
      await supabaseService
        .from('creator_subscriptions')
        .delete()
        .eq('stripe_subscription_id', staleRecord.stripe_subscription_id);
    }

    console.log('Active subscriber count for tier:', tierId, 'is:', activeCount);

    return createJsonResponse({
      subscriberCount: activeCount,
      tierId,
      creatorId
    });

  } catch (error) {
    console.error('Error getting subscriber count:', error);
    return createJsonResponse({ error: 'Failed to get subscriber count' }, 500);
  }
}
