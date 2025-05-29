
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
      
      // Enhanced cancellation check with proper timestamp handling
      const isActive = subscription.status === 'active';
      let isScheduledToCancel = false;
      let currentPeriodEnd = null;

      if (subscription.cancel_at_period_end === true && subscription.current_period_end) {
        // Handle both string and number timestamps more carefully
        if (typeof subscription.current_period_end === 'string') {
          currentPeriodEnd = new Date(subscription.current_period_end);
        } else if (typeof subscription.current_period_end === 'number') {
          // If it's a Unix timestamp, convert it
          currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        }
        
        // Only consider it scheduled to cancel if the end date is in the future
        if (currentPeriodEnd && !isNaN(currentPeriodEnd.getTime())) {
          isScheduledToCancel = currentPeriodEnd > new Date();
        }
      }

      console.log('[SubscriptionCheck] Enhanced cancellation analysis:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
        currentPeriodEndDate: currentPeriodEnd?.toISOString(),
        isActive,
        isScheduledToCancel,
        nowDate: new Date().toISOString()
      });

      // Return subscription data with enhanced cancellation info
      const subscriptionWithCancelInfo = {
        ...subscription,
        isActive,
        isScheduledToCancel,
        // Ensure we have the correct period end format
        current_period_end: currentPeriodEnd ? currentPeriodEnd.toISOString() : subscription.current_period_end,
        // Preserve the original cancellation flag
        cancel_at_period_end: subscription.cancel_at_period_end
      };

      // Return isSubscribed as true for active subscriptions, regardless of cancellation status
      return {
        isSubscribed: isActive,
        subscription: subscriptionWithCancelInfo
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 30000, // Increased from 5000 to reduce aggressive refreshing
    gcTime: 60000, // Increased cache time
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent unwanted refreshes
    refetchOnMount: true,
    refetchInterval: 60000, // Increased from 15000 to 60000 (1 minute) to reduce polling frequency
  });

  return {
    subscriptionData,
    isLoading,
    refetch
  };
};
