
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSimpleSubscriptionCheck = (tierId?: string, creatorId?: string) => {
  const { user } = useAuth();

  const { data: subscriptionStatus, isLoading, refetch } = useQuery({
    queryKey: ['simple-subscription-check', user?.id, tierId, creatorId],
    queryFn: async () => {
      if (!user?.id || !tierId || !creatorId) {
        return { isSubscribed: false, subscription: null };
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Subscription check error:', error);
        return { isSubscribed: false, subscription: null };
      }

      return {
        isSubscribed: !!data,
        subscription: data
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 30000,
    refetchOnWindowFocus: true
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
