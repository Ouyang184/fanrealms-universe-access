
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useSubscriptionCheck = (tierId?: string, creatorId?: string) => {
  const { user } = useAuth();

  const { data: subscriptionStatus, isLoading, refetch } = useQuery({
    queryKey: ['enhancedSubscriptionCheck', user?.id, tierId, creatorId],
    queryFn: async () => {
      if (!user?.id || !tierId || !creatorId) {
        return { isSubscribed: false, data: null };
      }

      console.log('useSubscriptionCheck: Checking subscription for:', { 
        userId: user.id, 
        tierId, 
        creatorId 
      });

      // Check user_subscriptions table
      const { data: userSubs, error: userSubsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'active');

      if (userSubsError) {
        console.error('Error checking user subscriptions:', userSubsError);
        return { isSubscribed: false, data: null };
      }

      if (userSubs && userSubs.length > 0) {
        const activeSub = userSubs[0];
        
        // If we have a stripe_subscription_id, we could verify with Stripe
        // For now, just trust the database status
        console.log('Active subscription found:', activeSub.id);
        return { isSubscribed: true, data: activeSub };
      }

      // Check basic subscriptions table as fallback
      const { data: basicSubs, error: basicSubsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('is_paid', true);

      if (basicSubsError) {
        console.error('Error checking basic subscriptions:', basicSubsError);
      }

      if (basicSubs && basicSubs.length > 0) {
        console.log('Found basic subscription');
        return { isSubscribed: true, data: basicSubs[0] };
      }

      console.log('No active subscription found');
      return { isSubscribed: false, data: null };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
