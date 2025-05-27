
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

      console.log('Found subscription records:', allSubs.length, allSubs);

      // If we have any subscription records, verify them with Stripe
      let activeSubscription = null;
      const staleRecords = [];

      for (const sub of allSubs) {
        if ('stripe_subscription_id' in sub && sub.stripe_subscription_id) {
          try {
            console.log('Verifying subscription with Stripe:', sub.stripe_subscription_id);
            
            // Call our edge function to verify with Stripe
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('stripe-subscriptions', {
              body: {
                action: 'verify_subscription',
                subscriptionId: sub.stripe_subscription_id
              }
            });

            console.log('Stripe verification result:', verifyResult, verifyError);

            if (verifyError || !verifyResult?.isActive) {
              console.log('Subscription not active in Stripe, marking as stale:', sub.id);
              staleRecords.push(sub);
            } else if (verifyResult.isActive && !verifyResult.cancelAtPeriodEnd) {
              console.log('Found truly active subscription:', sub.id);
              activeSubscription = sub;
              break;
            }
          } catch (error) {
            console.error('Error verifying subscription with Stripe:', error);
            staleRecords.push(sub);
          }
        } else {
          // Check if it's a basic subscription that should be considered active
          if ('is_paid' in sub && sub.is_paid) {
            console.log('Found basic paid subscription:', sub.id);
            activeSubscription = sub;
          } else {
            staleRecords.push(sub);
          }
        }
      }

      // Don't clean up records automatically - let the user sync manually
      console.log('Stale records found (not auto-cleaning):', staleRecords.length);

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
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
