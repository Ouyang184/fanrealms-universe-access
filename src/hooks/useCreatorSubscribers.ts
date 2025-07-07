
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useCreatorSubscribers = (creatorId: string) => {
  const { user } = useAuth();

  const { data: subscribers, isLoading, refetch } = useQuery({
    queryKey: ['simple-creator-subscribers', creatorId],
    queryFn: async () => {
      if (!creatorId) return [];

      console.log('[useCreatorSubscribers] Fetching subscribers for creator:', creatorId);

      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'get_creator_subscribers',
          creatorId
        }
      });

      if (error) {
        console.error('[useCreatorSubscribers] Get subscribers error:', error);
        return [];
      }

      console.log('[useCreatorSubscribers] Raw response data:', data);
      console.log('[useCreatorSubscribers] Subscribers data received:', data?.subscribers?.length || 0, 'subscribers');
      
      // Log each subscriber for debugging
      if (data?.subscribers) {
        data.subscribers.forEach((sub: any, index: number) => {
          console.log(`[useCreatorSubscribers] Subscriber ${index + 1}:`, {
            id: sub.id,
            user_id: sub.user_id,
            creator_id: sub.creator_id,
            tier_id: sub.tier_id,
            status: sub.status,
            stripe_subscription_id: sub.stripe_subscription_id,
            amount: sub.amount,
            tier_title: sub.tier?.title
          });
        });
      }
      
      // Log status breakdown for debugging
      const statusBreakdown = data?.subscribers?.reduce((counts: any, sub: any) => {
        counts[sub.status] = (counts[sub.status] || 0) + 1;
        return counts;
      }, {}) || {};
      
      console.log('[useCreatorSubscribers] Status breakdown:', statusBreakdown);

      return data?.subscribers || [];
    },
    enabled: !!creatorId && !!user,
    staleTime: 0, // Always fetch fresh data to debug the issue
    refetchInterval: false, // Disable auto-refetch for now to avoid spam
    refetchOnWindowFocus: true,
    retry: 3
  });

  return {
    subscribers,
    isLoading,
    refetch
  };
};
