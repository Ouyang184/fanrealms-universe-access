
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

      console.log('Found subscription records:', allSubs.length);

      // Verify each subscription against Stripe and clean up stale records
      let activeSubscription = null;
      const staleRecords = [];

      for (const sub of allSubs) {
        if ('stripe_subscription_id' in sub && sub.stripe_subscription_id) {
          try {
            // Call our edge function to verify with Stripe
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('stripe-subscriptions', {
              body: {
                action: 'verify_subscription',
                subscriptionId: sub.stripe_subscription_id
              }
            });

            if (verifyError) {
              console.error('Error verifying subscription:', verifyError);
              staleRecords.push(sub);
            } else if (verifyResult?.isActive || verifyResult?.isPendingPayment) {
              console.log('Found active or pending subscription:', sub.id, 'status:', verifyResult.status);
              activeSubscription = {
                ...sub,
                stripeStatus: verifyResult.status,
                isPendingPayment: verifyResult.isPendingPayment
              };
              break;
            } else {
              console.log('Subscription not active, marking as stale:', sub.id, 'status:', verifyResult?.status);
              staleRecords.push(sub);
            }
          } catch (error) {
            console.error('Error verifying subscription with Stripe:', error);
            staleRecords.push(sub);
          }
        } else {
          // No Stripe subscription ID, check if it's just a basic subscription record
          if ('is_paid' in sub && sub.is_paid) {
            // For basic subscriptions without Stripe integration, consider them stale if no Stripe ID
            staleRecords.push(sub);
          }
        }
      }

      // Clean up stale records
      for (const staleRecord of staleRecords) {
        console.log('Cleaning up stale subscription record:', staleRecord.id);
        
        if ('stripe_subscription_id' in staleRecord) {
          // Creator subscription
          await supabase
            .from('creator_subscriptions')
            .delete()
            .eq('id', staleRecord.id);
        } else {
          // Basic subscription
          await supabase
            .from('subscriptions')
            .delete()
            .eq('id', staleRecord.id);
        }
      }

      if (activeSubscription) {
        console.log('useSubscriptionCheck: Found active/pending subscription');
        return {
          isSubscribed: !activeSubscription.isPendingPayment, // Only true if fully active
          isPendingPayment: activeSubscription.isPendingPayment,
          data: activeSubscription
        };
      }

      console.log('useSubscriptionCheck: No active subscription found');
      return { isSubscribed: false, isPendingPayment: false, data: null };
    },
    enabled: !!user?.id && !!tierId && !!creatorId,
    staleTime: 10000, // 10 seconds - more frequent checks
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    subscriptionStatus,
    isLoading,
    refetch
  };
};
