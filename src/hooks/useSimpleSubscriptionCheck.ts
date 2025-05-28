
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSimpleSubscriptionCheck = (tierId?: string, creatorId?: string) => {
  const { user } = useAuth();

  const { data: subscriptionData, isLoading, refetch } = useQuery({
    queryKey: ['simple-subscription-check', user?.id, tierId, creatorId],
    queryFn: async () => {
      if (!user?.id || !tierId || !creatorId) {
        console.log('Missing required data for subscription check:', { userId: user?.id, tierId, creatorId });
        return { isSubscribed: false, subscription: null };
      }

      console.log('Simple subscription check for:', { userId: user.id, tierId, creatorId });

      // Check in user_subscriptions table
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Simple subscription check error:', error);
        return { isSubscribed: false, subscription: null };
      }

      console.log('Simple subscription check result:', { 
        isSubscribed: !!data, 
        subscription: data,
        rawData: data
      });

      return {
        isSubscribed: !!data,
        subscription: data
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
