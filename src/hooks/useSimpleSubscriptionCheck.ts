
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSimpleSubscriptionCheck = (tierId?: string, creatorId?: string) => {
  const { user } = useAuth();

  const { data: subscriptionData, isLoading, refetch } = useQuery({
    queryKey: ['simple-subscription-check', user?.id, tierId, creatorId],
    queryFn: async () => {
      if (!user?.id || !tierId || !creatorId) {
        console.log('[SubscriptionCheck] Missing required data:', { userId: user?.id, tierId, creatorId });
        return { isSubscribed: false, subscription: null };
      }

      console.log('[SubscriptionCheck] Checking subscription for:', { userId: user.id, tierId, creatorId });

      // ENHANCED: First, let's check if creatorId is actually a user_id and get the creator profile ID
      let actualCreatorId = creatorId;
      
      // Try to find creator by user_id if the provided creatorId might be a user_id
      const { data: creatorByUserId, error: creatorError } = await supabase
        .from('creators')
        .select('id, user_id, display_name')
        .eq('user_id', creatorId)
        .single();

      if (creatorByUserId && !creatorError) {
        actualCreatorId = creatorByUserId.id;
        console.log('[SubscriptionCheck] Found creator by user_id:', {
          inputCreatorId: creatorId,
          actualCreatorId: actualCreatorId,
          creatorDisplayName: creatorByUserId.display_name
        });
      } else {
        // If not found by user_id, check if it's already a creator profile ID
        const { data: creatorById } = await supabase
          .from('creators')
          .select('id, user_id, display_name')
          .eq('id', creatorId)
          .single();
          
        if (creatorById) {
          console.log('[SubscriptionCheck] Creator found by profile ID:', {
            creatorId: creatorById.id,
            userId: creatorById.user_id,
            displayName: creatorById.display_name
          });
        }
      }

      // Query user_subscriptions table with both original and resolved creator IDs
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          membership_tiers (
            id,
            title,
            creator_id
          )
        `)
        .eq('user_id', user.id)
        .in('creator_id', [creatorId, actualCreatorId])
        .eq('tier_id', tierId);

      if (error) {
        console.error('[SubscriptionCheck] Database error:', error);
        return { isSubscribed: false, subscription: null };
      }

      console.log('[SubscriptionCheck] All subscription records found:', data);

      // Also check for any subscriptions by this user to this creator (regardless of tier)
      const { data: allUserSubs } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          membership_tiers (
            id,
            title,
            creator_id
          )
        `)
        .eq('user_id', user.id)
        .in('creator_id', [creatorId, actualCreatorId]);

      console.log('[SubscriptionCheck] All user subscriptions to this creator:', allUserSubs);

      // Filter for active subscriptions only - exclude canceled ones
      const activeSubscriptions = data?.filter(sub => 
        sub.status === 'active' && sub.status !== 'canceled'
      ) || [];
      console.log('[SubscriptionCheck] Active subscriptions for tier:', activeSubscriptions);

      if (activeSubscriptions.length === 0) {
        console.log('[SubscriptionCheck] No active subscriptions found');
        return { isSubscribed: false, subscription: null };
      }

      const subscription = activeSubscriptions[0];
      
      // Enhanced subscription validation - FIXED LOGIC
      let isCurrentlyActive = subscription.status === 'active';
      
      // If subscription is canceled, it's not active
      if (subscription.status === 'canceled') {
        isCurrentlyActive = false;
      } else if (subscription.cancel_at_period_end === true && subscription.current_period_end) {
        // Check if subscription is scheduled to cancel but still active
        const periodEndDate = new Date(subscription.current_period_end);
        const now = new Date();
        
        // If scheduled to cancel but period hasn't ended yet, it's still active
        isCurrentlyActive = periodEndDate > now;
        
        console.log('[SubscriptionCheck] Cancellation check:', {
          subscriptionId: subscription.id,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: subscription.current_period_end,
          periodEndDate: periodEndDate.toISOString(),
          nowDate: now.toISOString(),
          isStillActive: isCurrentlyActive
        });
      }

      console.log('[SubscriptionCheck] FINAL RESULT - User has access:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        isCurrentlyActive,
        hasAccess: isCurrentlyActive,
        userId: user.id,
        tierId,
        originalCreatorId: creatorId,
        resolvedCreatorId: actualCreatorId,
        tierInfo: subscription.membership_tiers
      });

      return {
        isSubscribed: isCurrentlyActive,
        subscription: {
          ...subscription,
          isActive: isCurrentlyActive
        }
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 5000, // 5 seconds - shorter cache for real-time updates
    gcTime: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionData,
    isLoading,
    refetch
  };
};
