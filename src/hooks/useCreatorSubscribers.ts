
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

      console.log('[useCreatorSubscribers] Subscribers received:', data?.subscribers?.length || 0);
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
