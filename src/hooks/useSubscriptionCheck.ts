
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionData {
  id: string;
  user_id: string;
  creator_id: string;
  tier_id: string;
  status: string;
  stripe_subscription_id: string;
  current_period_end: string;
}

interface SubscriptionCheckResult {
  isSubscribed: boolean;
  data: SubscriptionData | null;
}

export const useSubscriptionCheck = (tierId: string, creatorId: string) => {
  const { user } = useAuth();

  const { data: subscriptionStatus, isLoading, refetch } = useQuery({
    queryKey: ['enhancedSubscriptionCheck', user?.id, tierId, creatorId],
    queryFn: async (): Promise<SubscriptionCheckResult> => {
      if (!user?.id) {
        return { isSubscribed: false, data: null };
      }
      
      console.log('Enhanced subscription check for user:', user.id, 'tier:', tierId, 'creator:', creatorId);
      
      // Check creator_subscriptions table first (most reliable)
      const { data: creatorSubs, error: creatorSubsError } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (creatorSubsError) {
        console.error('Error checking creator subscriptions:', creatorSubsError);
        return { isSubscribed: false, data: null };
      }

      if (creatorSubs && creatorSubs.length > 0) {
        console.log('Active subscription found:', creatorSubs[0]);
        return { isSubscribed: true, data: creatorSubs[0] };
      }

      // Also check regular subscriptions table as fallback
      const { data: regularSubs, error: regularSubsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('is_paid', true);

      if (regularSubsError) {
        console.error('Error checking regular subscriptions:', regularSubsError);
      }

      if (regularSubs && regularSubs.length > 0) {
        console.log('Regular subscription found:', regularSubs[0]);
        // Convert to creator subscription format
        return { 
          isSubscribed: true, 
          data: {
            id: regularSubs[0].id,
            user_id: regularSubs[0].user_id,
            creator_id: regularSubs[0].creator_id,
            tier_id: regularSubs[0].tier_id,
            status: 'active',
            stripe_subscription_id: '',
            current_period_end: ''
          }
        };
      }

      console.log('No active subscription found');
      return { isSubscribed: false, data: null };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 2000, // Refetch every 2 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionStatus: subscriptionStatus || { isSubscribed: false, data: null },
    isLoading,
    refetch
  };
};
