
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
      
      // Check subscription cancellation status with improved timestamp handling
      const isActive = subscription.status === 'active';
      let isScheduledToCancel = false;
      let currentPeriodEnd = null;

      if (subscription.cancel_at_period_end === true && subscription.current_period_end) {
        // Handle both string and number timestamps
        if (typeof subscription.current_period_end === 'string') {
          currentPeriodEnd = new Date(subscription.current_period_end);
        } else {
          // If it's a number (Unix timestamp), convert it
          currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
        
        // Only consider it scheduled to cancel if the end date is in the future
        isScheduledToCancel = currentPeriodEnd > new Date();
      }

      console.log('[SubscriptionCheck] Subscription analysis:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
        currentPeriodEndDate: currentPeriodEnd?.toISOString(),
        isActive,
        isScheduledToCancel
      });

      // Return subscription data with enhanced cancellation info
      const subscriptionWithCancelInfo = {
        ...subscription,
        isActive,
        isScheduledToCancel,
        // Ensure we have the correct period end format
        current_period_end: currentPeriodEnd ? currentPeriodEnd.toISOString() : subscription.current_period_end,
        // Legacy compatibility
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: currentPeriodEnd ? currentPeriodEnd.toISOString() : subscription.current_period_end
      };

      return {
        isSubscribed: isActive,
        subscription: subscriptionWithCancelInfo
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 5000, // Reduced from 0 to prevent too frequent refetches
    gcTime: 10000, // Reduced cache time
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 15000, // Reduced from 30000 to check more frequently
  });

  return {
    subscriptionData,
    isLoading,
    refetch
  };
};
