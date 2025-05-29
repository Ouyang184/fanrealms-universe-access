
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
      
      // Check if this active subscription is scheduled to cancel
      // We need to check the Stripe subscription directly for cancel_at_period_end flag
      const isScheduledToCancel = subscription.current_period_end && 
        new Date(subscription.current_period_end) > new Date();

      console.log('[SubscriptionCheck] Subscription analysis:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        isScheduledToCancel
      });

      // Return subscription data with cancelling info if applicable
      const subscriptionWithCancelInfo = {
        ...subscription,
        // Mark as cancelling if we have a future period end date (indicates cancel_at_period_end was set)
        cancel_at_period_end: isScheduledToCancel,
        cancel_at: subscription.current_period_end
      };

      return {
        isSubscribed: true,
        subscription: subscriptionWithCancelInfo
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  return {
    subscriptionData,
    isLoading,
    refetch
  };
};
