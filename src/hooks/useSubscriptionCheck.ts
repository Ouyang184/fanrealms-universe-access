
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

      // First, check for any active subscription to this creator (any tier)
      const { data: creatorSubscriptions, error: creatorError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('status', 'active');

      if (creatorError) {
        console.error('Creator subscription check error:', creatorError);
      }

      // Check for specific tier subscription
      const { data: tierSubscription, error: tierError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .maybeSingle();

      if (tierError) {
        console.error('Tier subscription check error:', tierError);
        return { isSubscribed: false, subscription: null };
      }

      console.log('Subscription check result:', { 
        isSubscribed: !!tierSubscription, 
        subscription: tierSubscription,
        hasAnyCreatorSubscription: !!(creatorSubscriptions && creatorSubscriptions.length > 0),
        creatorSubscriptions: creatorSubscriptions
      });

      return {
        isSubscribed: !!tierSubscription,
        subscription: tierSubscription,
        hasAnyCreatorSubscription: !!(creatorSubscriptions && creatorSubscriptions.length > 0),
        creatorSubscriptions: creatorSubscriptions || []
      };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 0,
    gcTime: 0, // Don't cache results
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: (failureCount, error) => {
      // Retry up to 3 times with increasing delays
      if (failureCount < 3) {
        setTimeout(() => {
          console.log(`Retrying subscription check (attempt ${failureCount + 1})`);
        }, 1000 * (failureCount + 1)); // 1s, 2s, 3s delays
        return true;
      }
      return false;
    }
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
