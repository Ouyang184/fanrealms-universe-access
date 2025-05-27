
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

      // First check creator_subscriptions (Stripe managed)
      const { data: stripeSubscription, error: stripeError } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .maybeSingle();

      if (stripeError) {
        console.error('Error checking Stripe subscription:', stripeError);
      }

      if (stripeSubscription) {
        console.log('useSubscriptionCheck: Found active Stripe subscription');
        return {
          isSubscribed: true,
          data: stripeSubscription
        };
      }

      // If no Stripe subscription, check basic subscriptions
      const { data: basicSubscription, error: basicError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('is_paid', true)
        .maybeSingle();

      if (basicError) {
        console.error('Error checking basic subscription:', basicError);
      }

      if (basicSubscription) {
        console.log('useSubscriptionCheck: Found active basic subscription');
        return {
          isSubscribed: true,
          data: basicSubscription
        };
      }

      console.log('useSubscriptionCheck: No active subscription found');
      return { isSubscribed: false, data: null };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: false, // Remove automatic polling to avoid conflicts
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
