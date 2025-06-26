
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionCheck = (creatorId?: string, tierId?: string) => {
  const { user } = useAuth();

  const { data: subscriptionData, isLoading, refetch } = useQuery({
    queryKey: ['subscription-check', user?.id, creatorId, tierId],
    queryFn: async () => {
      if (!user?.id || !creatorId) {
        return { isSubscribed: false, subscription: null };
      }

      // First check for any active subscription to this creator
      const { data: generalSub, error: generalError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id as any)
        .eq('creator_id', creatorId as any)
        .eq('status', 'active' as any)
        .maybeSingle();

      if (generalError) {
        console.error('Error checking general subscription:', generalError);
      }

      // If a specific tier is requested, check for that tier
      if (tierId) {
        const { data: tierSub, error: tierError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id as any)
          .eq('creator_id', creatorId as any)
          .eq('tier_id', tierId as any)
          .eq('status', 'active' as any)
          .maybeSingle();

        if (tierError) {
          console.error('Error checking tier subscription:', tierError);
        }

        return {
          isSubscribed: !!tierSub,
          subscription: tierSub,
          hasAnySubscription: !!generalSub
        };
      }

      return {
        isSubscribed: !!generalSub,
        subscription: generalSub,
        hasAnySubscription: !!generalSub
      };
    },
    enabled: !!user?.id && !!creatorId,
    staleTime: 5000, // 5 seconds
    gcTime: 30000, // 30 seconds
  });

  return {
    subscriptionData,
    isLoading,
    refetch
  };
};
