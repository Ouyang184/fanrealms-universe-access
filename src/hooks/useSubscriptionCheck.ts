
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

      // Check both tables for any subscription records
      const [creatorSubsResult, basicSubsResult] = await Promise.all([
        supabase
          .from('creator_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('creator_id', creatorId)
          .eq('tier_id', tierId),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('creator_id', creatorId)
          .eq('tier_id', tierId)
          .eq('is_paid', true)
      ]);

      if (creatorSubsResult.error) {
        console.error('Error checking creator subscriptions:', creatorSubsResult.error);
      }

      if (basicSubsResult.error) {
        console.error('Error checking basic subscriptions:', basicSubsResult.error);
      }

      const allSubs = [
        ...(creatorSubsResult.data || []),
        ...(basicSubsResult.data || [])
      ];

      console.log('Found subscription records:', allSubs.length);

      // Find the most recent active subscription
      let activeSubscription = null;

      for (const sub of allSubs) {
        // For creator subscriptions, check if status is active
        if ('status' in sub && sub.status === 'active') {
          activeSubscription = sub;
          break;
        }
        
        // For basic subscriptions, if it has is_paid = true, consider it active
        if ('is_paid' in sub && sub.is_paid) {
          activeSubscription = sub;
          break;
        }
      }

      if (activeSubscription) {
        console.log('useSubscriptionCheck: Found active subscription');
        return {
          isSubscribed: true,
          data: activeSubscription
        };
      }

      console.log('useSubscriptionCheck: No active subscription found');
      return { isSubscribed: false, data: null };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
