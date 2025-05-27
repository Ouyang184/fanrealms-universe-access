
import { createJsonResponse } from '../utils/cors.ts';

export async function handleGetUserSubscriptions(
  stripe: any,
  supabaseService: any,
  userId: string,
  creatorId: string
) {
  console.log('Getting user subscriptions for user:', userId, 'creator:', creatorId);

  try {
    // Get all subscription records for this user and creator
    const [creatorSubsResult, basicSubsResult] = await Promise.all([
      supabaseService
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('creator_id', creatorId),
      supabaseService
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('creator_id', creatorId)
    ]);

    if (creatorSubsResult.error) {
      console.error('Error fetching creator subscriptions:', creatorSubsResult.error);
    }

    if (basicSubsResult.error) {
      console.error('Error fetching basic subscriptions:', basicSubsResult.error);
    }

    const allSubs = [
      ...(creatorSubsResult.data || []),
      ...(basicSubsResult.data || [])
    ];

    // Verify each subscription with Stripe
    const activeSubscriptions = [];
    const staleRecords = [];

    for (const sub of allSubs) {
      if ('stripe_subscription_id' in sub && sub.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
          
          if (stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end) {
            activeSubscriptions.push({
              ...sub,
              status: 'active',
              stripe_status: stripeSubscription.status
            });
          } else {
            staleRecords.push(sub);
          }
        } catch (stripeError) {
          console.error('Stripe subscription not found:', sub.stripe_subscription_id);
          staleRecords.push(sub);
        }
      } else {
        // Basic subscription without Stripe - consider stale
        staleRecords.push(sub);
      }
    }

    // Clean up stale records
    for (const staleRecord of staleRecords) {
      console.log('Cleaning up stale subscription record:', staleRecord.id);
      
      if ('stripe_subscription_id' in staleRecord) {
        await supabaseService
          .from('creator_subscriptions')
          .delete()
          .eq('id', staleRecord.id);
      } else {
        await supabaseService
          .from('subscriptions')
          .delete()
          .eq('id', staleRecord.id);
      }
    }

    console.log('Active subscriptions found:', activeSubscriptions.length);

    return createJsonResponse({
      subscriptions: activeSubscriptions,
      userId,
      creatorId
    });

  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return createJsonResponse({ error: 'Failed to get user subscriptions' }, 500);
  }
}
