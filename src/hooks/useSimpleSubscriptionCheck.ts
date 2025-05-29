
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

      // Always check the cancel_at_period_end flag first
      if (subscription.cancel_at_period_end === true) {
        isScheduledToCancel = true;
        
        // Handle period end timestamp conversion
        if (subscription.current_period_end) {
          if (typeof subscription.current_period_end === 'string') {
            currentPeriodEnd = new Date(subscription.current_period_end);
          } else if (typeof subscription.current_period_end === 'number') {
            currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          }
          
          // Double-check that the end date is still in the future
          if (currentPeriodEnd && !isNaN(currentPeriodEnd.getTime())) {
            const now = new Date();
            if (currentPeriodEnd <= now) {
              // Period has already ended, subscription should be considered inactive
              isScheduledToCancel = false;
              console.log('[SubscriptionCheck] Subscription period has ended, considering inactive');
              return { isSubscribed: false, subscription: null };
            }
          }
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
        // Preserve the original cancellation flag - this is critical
        cancel_at_period_end: subscription.cancel_at_period_end
      };

      // Return isSubscribed as true for active subscriptions, regardless of cancellation status
      // The UI will handle showing the "ending soon" state based on isScheduledToCancel
      return {
        isSubscribed: isActive,
        subscription: subscriptionWithCancelInfo
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 300000, // 5 minutes - much longer since we're not auto-refreshing
    gcTime: 300000, // 5 minutes cache time
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: true,
    // Removed refetchInterval - no automatic refresh
  });

  return {
    subscriptionData,
    isLoading,
    refetch
  };
};
