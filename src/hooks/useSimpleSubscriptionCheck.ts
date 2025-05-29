
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

      // Query user_subscriptions table with detailed logging
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId);

      if (error) {
        console.error('[SubscriptionCheck] Database error:', error);
        return { isSubscribed: false, subscription: null };
      }

      console.log('[SubscriptionCheck] All subscription records found:', data);

      // Filter for active subscriptions only
      const activeSubscriptions = data?.filter(sub => sub.status === 'active') || [];
      console.log('[SubscriptionCheck] Active subscriptions:', activeSubscriptions);

      if (activeSubscriptions.length === 0) {
        return { isSubscribed: false, subscription: null };
      }

      const subscription = activeSubscriptions[0];
      
      // Enhanced subscription validation - FIXED LOGIC
      let isCurrentlyActive = subscription.status === 'active';
      
      // Check if subscription is scheduled to cancel but still active
      if (subscription.cancel_at_period_end === true && subscription.current_period_end) {
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
        creatorId
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
