
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
      
      // Check creator_subscriptions table first - look for ANY active subscription to this creator
      const { data: creatorSubs, error: creatorSubError } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .in('status', ['active', 'cancelling']); // Include cancelling status

      if (creatorSubError && creatorSubError.code !== 'PGRST116') {
        console.error('Error checking creator_subscriptions:', creatorSubError);
      }

      if (creatorSubs && creatorSubs.length > 0) {
        console.log('Found active subscriptions in creator_subscriptions:', creatorSubs.length);
        // Check if any subscription matches the specific tier
        const tierSpecificSub = creatorSubs.find(sub => sub.tier_id === tierId);
        if (tierSpecificSub) {
          console.log('Found tier-specific subscription:', tierSpecificSub);
          
          // Check if subscription is still active (not past cancel_at date)
          const isStillActive = !tierSpecificSub.cancel_at || new Date() < new Date(tierSpecificSub.cancel_at);
          
          return { 
            isSubscribed: isStillActive, 
            source: 'creator_subscriptions', 
            data: tierSpecificSub,
            isCancelling: tierSpecificSub.status === 'cancelling',
            cancelAt: tierSpecificSub.cancel_at
          };
        }
        // If no tier-specific sub found, user is subscribed to creator but different tier
        console.log('User subscribed to creator but different tier');
        const firstSub = creatorSubs[0];
        const isStillActive = !firstSub.cancel_at || new Date() < new Date(firstSub.cancel_at);
        
        return { 
          isSubscribed: isStillActive, 
          source: 'creator_subscriptions', 
          data: firstSub,
          isCancelling: firstSub.status === 'cancelling',
          cancelAt: firstSub.cancel_at
        };
      }

      // Check subscriptions table as fallback
      const { data: regularSub, error: regularSubError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('is_paid', true);

      if (regularSubError && regularSubError.code !== 'PGRST116') {
        console.error('Error checking subscriptions:', regularSubError);
      }

      if (regularSub && regularSub.length > 0) {
        console.log('Found subscription in subscriptions table:', regularSub);
        const tierSpecificSub = regularSub.find(sub => sub.tier_id === tierId);
        if (tierSpecificSub) {
          return { isSubscribed: true, source: 'subscriptions', data: tierSpecificSub };
        }
        return { isSubscribed: true, source: 'subscriptions', data: regularSub[0] };
      }

      console.log('No active subscription found');
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
          event.detail?.creatorId === creatorId) {
        
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
