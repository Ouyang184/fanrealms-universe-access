
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

      // Check creator_subscriptions first (Stripe-managed)
      const { data: creatorSubs, error: creatorSubsError } = await supabase
        .from('creator_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'active');

      if (creatorSubsError) {
        console.error('Error checking creator subscriptions:', creatorSubsError);
      }

      // If we have an active creator subscription, verify it with Stripe
      if (creatorSubs && creatorSubs.length > 0) {
        const activeSub = creatorSubs[0];
        
        // Only verify with Stripe if we have a stripe_subscription_id
        if (activeSub.stripe_subscription_id) {
          try {
            console.log('Verifying subscription with Stripe:', activeSub.stripe_subscription_id);
            
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('stripe-subscriptions', {
              body: {
                action: 'verify_subscription',
                subscriptionId: activeSub.stripe_subscription_id
              }
            });

            if (verifyError) {
              console.error('Stripe verification error:', verifyError);
              // Don't delete on verification error, just return current state
              return { isSubscribed: true, data: activeSub };
            }

            if (verifyResult?.isActive) {
              console.log('Stripe confirms subscription is active');
              return { isSubscribed: true, data: activeSub };
            } else {
              console.log('Stripe says subscription is not active, but keeping record');
              // Don't auto-delete, let manual sync handle cleanup
              return { isSubscribed: false, data: null };
            }
          } catch (error) {
            console.error('Error verifying with Stripe:', error);
            // On error, assume subscription is still valid
            return { isSubscribed: true, data: activeSub };
          }
        } else {
          // No Stripe ID but marked as active - treat as valid
          console.log('Active subscription without Stripe ID');
          return { isSubscribed: true, data: activeSub };
        }
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
    staleTime: 30000, // 30 seconds - longer cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
