
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

      const isSubscribed = activeSubscriptions.length > 0;
      const subscription = activeSubscriptions.length > 0 ? activeSubscriptions[0] : null;

      console.log('[SubscriptionCheck] Final result:', { 
        isSubscribed, 
        subscription,
        totalRecords: data?.length || 0,
        activeRecords: activeSubscriptions.length,
        query: { userId: user.id, creatorId, tierId }
      });

      return {
        isSubscribed,
        subscription
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
