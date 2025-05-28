
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useCreatorSubscribers = (creatorId: string) => {
  const { user } = useAuth();

  const { data: subscribers, isLoading, refetch } = useQuery({
    queryKey: ['simple-creator-subscribers', creatorId],
    queryFn: async () => {
      if (!creatorId) return [];

      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'get_creator_subscribers',
          creatorId
        }
      });

      if (error) {
        console.error('Get subscribers error:', error);
        return [];
      }

      return data?.subscribers || [];
    },
    enabled: !!creatorId && !!user,
    staleTime: 30000,
    refetchInterval: 60000
  });

  return {
    subscribers,
    isLoading,
    refetch
  };
};
