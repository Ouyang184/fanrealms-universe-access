
import { createJsonResponse } from '../utils/cors.ts';

export async function handleSyncAllSubscriptions(
  stripe: any,
  supabaseService: any,
  creatorId?: string
) {
  console.log('Syncing all subscriptions for creator:', creatorId);

  try {
    let query = supabaseService.from('creator_subscriptions').select('*');
    
    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data: allSubs, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions to sync:', error);
      return createJsonResponse({ error: 'Failed to fetch subscriptions' }, 500);
    }

    let syncedCount = 0;
    let cleanedCount = 0;
    let activatedCount = 0;

    for (const sub of allSubs || []) {
      if (sub.stripe_subscription_id) {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
          
          const isActive = stripeSubscription.status === 'active' && !stripeSubscription.cancel_at_period_end;
          
          if (isActive && sub.status !== 'active') {
            // Activate subscription that became active
            await supabaseService
              .from('creator_subscriptions')
              .update({
                status: 'active',
                current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);

            // Ensure corresponding basic subscription exists for legacy compatibility
            await supabaseService
              .from('subscriptions')
              .upsert({
                user_id: sub.user_id,
                creator_id: sub.creator_id,
                tier_id: sub.tier_id,
                is_paid: true,
                created_at: sub.created_at
              }, { 
                onConflict: 'user_id,creator_id',
                ignoreDuplicates: false 
              });

            activatedCount++;
          } else if (isActive) {
            // Update existing active subscription
            await supabaseService
              .from('creator_subscriptions')
              .update({
                current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);

            syncedCount++;
          } else {
            // Mark as inactive but don't delete immediately
            await supabaseService
              .from('creator_subscriptions')
              .update({
                status: 'inactive',
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);

            // Remove from basic subscriptions
            await supabaseService
              .from('subscriptions')
              .delete()
              .eq('user_id', sub.user_id)
              .eq('creator_id', sub.creator_id)
              .eq('tier_id', sub.tier_id);

            cleanedCount++;
          }
        } catch (stripeError) {
          if (stripeError.code === 'resource_missing') {
            // Subscription doesn't exist in Stripe, mark as inactive
            await supabaseService
              .from('creator_subscriptions')
              .update({
                status: 'inactive',
                updated_at: new Date().toISOString()
              })
              .eq('id', sub.id);

            await supabaseService
              .from('subscriptions')
              .delete()
              .eq('user_id', sub.user_id)
              .eq('creator_id', sub.creator_id)
              .eq('tier_id', sub.tier_id);

            cleanedCount++;
          } else {
            console.error('Error checking Stripe subscription:', stripeError);
          }
        }
      }
    }

    console.log('Sync complete:', { syncedCount, cleanedCount, activatedCount });

    return createJsonResponse({
      success: true,
      syncedCount,
      cleanedCount,
      activatedCount,
      message: `Synced ${syncedCount} subscriptions, activated ${activatedCount}, cleaned ${cleanedCount} inactive records`
    });

  } catch (error) {
    console.error('Error syncing subscriptions:', error);
    return createJsonResponse({ error: 'Failed to sync subscriptions' }, 500);
  }
}
