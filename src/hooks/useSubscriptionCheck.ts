
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export const useSubscriptionCheck = (tierId: string, creatorId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscriptionStatus, refetch: refetchSubscriptionStatus } = useQuery({
    queryKey: ['enhancedSubscriptionCheck', user?.id, tierId, creatorId],
    queryFn: async () => {
      if (!user?.id) return { isSubscribed: false, source: 'no-user' };
      
      console.log('Enhanced subscription check for user:', user.id, 'tier:', tierId, 'creator:', creatorId);
      
      // Check creator_subscriptions table first
      const { data: creatorSub, error: creatorSubError } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tier_id', tierId)
        .eq('status', 'active')
        .maybeSingle();

      if (creatorSubError) {
        console.error('Error checking creator_subscriptions:', creatorSubError);
      }

      if (creatorSub) {
        console.log('Found active subscription in creator_subscriptions:', creatorSub);
        return { isSubscribed: true, source: 'creator_subscriptions', data: creatorSub };
      }

      // Check subscriptions table as fallback
      const { data: regularSub, error: regularSubError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('is_paid', true)
        .maybeSingle();

      if (regularSubError) {
        console.error('Error checking subscriptions:', regularSubError);
      }

      if (regularSub) {
        console.log('Found subscription in subscriptions table:', regularSub);
        return { isSubscribed: true, source: 'subscriptions', data: regularSub };
      }

      console.log('No active subscription found in either table');
      return { isSubscribed: false, source: 'none' };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 0,
    refetchInterval: 3000,
  });

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionUpdate = async (event: CustomEvent) => {
      console.log('useSubscriptionCheck: Received subscription event:', event.type, event.detail);
      
      if ((event.type === 'paymentSuccess' || event.type === 'subscriptionSuccess') && 
          event.detail?.tierId === tierId && event.detail?.creatorId === creatorId) {
        
        console.log('useSubscriptionCheck: Payment successful, updating subscription status');
        
        setTimeout(async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
            queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
            queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
          ]);
          
          await refetchSubscriptionStatus();
        }, 1000);
      } else if (event.type === 'subscriptionCanceled') {
        console.log('useSubscriptionCheck: Subscription canceled, updating subscription status');
        
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
          queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        ]);
        
        await refetchSubscriptionStatus();
      }
    };

    window.addEventListener('subscriptionSuccess', handleSubscriptionUpdate as EventListener);
    window.addEventListener('paymentSuccess', handleSubscriptionUpdate as EventListener);
    window.addEventListener('subscriptionCanceled', handleSubscriptionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionUpdate as EventListener);
      window.removeEventListener('paymentSuccess', handleSubscriptionUpdate as EventListener);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionUpdate as EventListener);
    };
  }, [queryClient, refetchSubscriptionStatus, tierId, creatorId]);

  return {
    subscriptionStatus,
    refetchSubscriptionStatus
  };
};
