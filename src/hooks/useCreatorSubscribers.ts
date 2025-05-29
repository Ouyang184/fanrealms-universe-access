
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

      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'get_creator_subscribers',
          creatorId
        }
      });

      if (error) {
        console.error('[useCreatorSubscribers] Get subscribers error:', error);
        return [];
      }

      console.log('[useCreatorSubscribers] Subscribers data received:', data?.subscribers?.length || 0, 'subscribers');
      
      // Log status breakdown for debugging
      const statusBreakdown = data?.subscribers?.reduce((counts: any, sub: any) => {
        counts[sub.status] = (counts[sub.status] || 0) + 1;
        return counts;
      }, {}) || {};
      
      console.log('[useCreatorSubscribers] Status breakdown:', statusBreakdown);

      return data?.subscribers || [];
    },
    enabled: !!creatorId && !!user,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute to stay synced with Stripe
    refetchOnWindowFocus: true, // Refetch when user returns to the page
    retry: 3 // Retry failed requests
  });

  return {
    subscribers,
    isLoading,
    refetch
  };
};
