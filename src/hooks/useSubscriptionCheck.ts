
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionCheck = (tierId?: string, creatorId?: string) => {
  const { user } = useAuth();

  const { data: subscriptionStatus, isLoading, refetch } = useQuery({
    queryKey: ['subscription-check', user?.id, tierId, creatorId],
    queryFn: async () => {
      if (!user?.id || !tierId || !creatorId) {
        return { isSubscribed: false, subscription: null };
      }

      console.log('Checking subscription for:', { userId: user.id, tierId, creatorId });

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

      console.log('Subscription check result:', { isSubscribed: !!data, subscription: data });

      return {
        isSubscribed: !!data,
        subscription: data
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 5000, // Reduced to 5 seconds for faster updates
    refetchOnWindowFocus: true,
    refetchInterval: 10000 // Check every 10 seconds
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
