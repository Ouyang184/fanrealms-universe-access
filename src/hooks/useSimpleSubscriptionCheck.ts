
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

      // FIXED: Check if creatorId is a creator profile ID first, then check if it's a user_id
      let actualCreatorId = creatorId;
      
      // First try to find creator by profile ID (most common case)
      const { data: creatorById, error: creatorByIdError } = await supabase
        .from('creators')
        .select('id, user_id, display_name')
        .eq('id', creatorId)
        .maybeSingle();

      if (creatorById && !creatorByIdError) {
        actualCreatorId = creatorById.id;
        console.log('[SubscriptionCheck] Creator found by profile ID:', {
          creatorId: creatorById.id,
          userId: creatorById.user_id,
          displayName: creatorById.display_name
        });
      } else {
        // If not found by ID, try to find by user_id
        const { data: creatorByUserId, error: creatorByUserIdError } = await supabase
          .from('creators')
          .select('id, user_id, display_name')
          .eq('user_id', creatorId)
          .maybeSingle();

        if (creatorByUserId && !creatorByUserIdError) {
          actualCreatorId = creatorByUserId.id;
          console.log('[SubscriptionCheck] Found creator by user_id:', {
            inputCreatorId: creatorId,
            actualCreatorId: actualCreatorId,
            creatorDisplayName: creatorByUserId.display_name
          });
        } else {
          console.log('[SubscriptionCheck] Creator not found by ID or user_id:', creatorId);
        }
      }

      // Query user_subscriptions table with resolved creator ID
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
        .eq('creator_id', actualCreatorId)
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
        .eq('creator_id', actualCreatorId);

      console.log('[SubscriptionCheck] All user subscriptions to this creator:', allUserSubs);

      // Filter for active subscriptions only
      const activeSubscriptions = data?.filter(sub => 
        sub.status === 'active'
      ) || [];
      
      console.log('[SubscriptionCheck] Active subscriptions for tier:', activeSubscriptions);

      if (activeSubscriptions.length === 0) {
        console.log('[SubscriptionCheck] No active subscriptions found');
        return { isSubscribed: false, subscription: null };
      }

      const subscription = activeSubscriptions[0];
      
      // Enhanced subscription validation - check if subscription is currently active
      let isCurrentlyActive = subscription.status === 'active';
      
      // Check if subscription is scheduled to cancel but still active
      if (subscription.cancel_at_period_end === true && subscription.current_period_end) {
        const periodEndDate = new Date(subscription.current_period_end);
        const now = new Date();
        
        // If scheduled to cancel but period hasn't ended yet, it's still active
        isCurrentlyActive = periodEndDate > now && subscription.status === 'active';
        
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
