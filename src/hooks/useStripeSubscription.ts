
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { StripeSubscription, CreatorEarnings } from '@/types';

export const useStripeSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user's active subscriptions with very aggressive refresh
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['userSubscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching user subscriptions for user:', user.id);
      
      // Query both tables to ensure we get all subscriptions
      const [creatorSubsResult, subsResult] = await Promise.all([
        supabase
          .from('creator_subscriptions')
          .select(`
            *,
            creator:creators (
              id,
              user_id,
              display_name,
              bio,
              profile_image_url,
              banner_url,
              follower_count,
              tags,
              users (
                id,
                username,
                email,
                profile_picture
              )
            ),
            tier:membership_tiers (
              id,
              title,
              description,
              price
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active'),
        
        supabase
          .from('subscriptions')
          .select(`
            *,
            creator:creators (
              id,
              user_id,
              display_name,
              bio,
              profile_image_url,
              banner_url,
              follower_count,
              tags,
              users (
                id,
                username,
                email,
                profile_picture
              )
            ),
            tier:membership_tiers (
              id,
              title,
              description,
              price
            )
          `)
          .eq('user_id', user.id)
          .eq('is_paid', true)
      ]);

      let subscriptions = creatorSubsResult.data || [];
      
      // If no active subscriptions in creator_subscriptions, check subscriptions table
      if (subscriptions.length === 0 && subsResult.data && subsResult.data.length > 0) {
        console.log('No active creator subscriptions found, checking subscriptions table');
        // Map subscriptions table data to creator_subscriptions format
        subscriptions = subsResult.data.map((sub: any) => ({
          id: sub.id,
          user_id: sub.user_id,
          creator_id: sub.creator_id,
          tier_id: sub.tier_id,
          stripe_subscription_id: '',
          stripe_customer_id: '',
          status: 'active',
          current_period_start: null,
          current_period_end: null,
          amount_paid: sub.tier?.price || 0,
          platform_fee: null,
          creator_earnings: null,
          created_at: sub.created_at,
          updated_at: sub.created_at,
          creator: sub.creator,
          tier: sub.tier
        }));
      }

      if (creatorSubsResult.error) {
        console.error('Error fetching creator subscriptions:', creatorSubsResult.error);
      }
      if (subsResult.error) {
        console.error('Error fetching subscriptions:', subsResult.error);
      }

      console.log('Fetched user subscriptions:', subscriptions);
      return subscriptions;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 2000, // Refetch every 2 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'create_subscription',
          tierId,
          creatorId
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Immediately invalidate and refetch subscription data
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] });
      
      // Force immediate refetch
      setTimeout(() => {
        refetchSubscriptions();
      }, 1000);
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      console.log('Cancelling subscription with ID:', subscriptionId);
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId
        }
      });

      if (error) {
        console.error('Cancel subscription error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      console.log('Subscription cancelled successfully');
      
      // Immediately invalidate and refetch subscription data
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['active-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] });
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] });
      
      // Force immediate refetch
      setTimeout(() => {
        refetchSubscriptions();
      }, 1000);
      
      toast({
        title: "Success",
        description: "Subscription canceled successfully.",
      });
    },
    onError: (error) => {
      console.error('Cancel subscription mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    },
  });

  const createSubscription = useCallback(async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    setIsProcessing(true);
    try {
      const result = await createSubscriptionMutation.mutateAsync({ tierId, creatorId });
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [createSubscriptionMutation]);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    try {
      console.log('useStripeSubscription: Cancelling subscription ID:', subscriptionId);
      await cancelSubscriptionMutation.mutateAsync(subscriptionId);
      
      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('subscriptionCanceled', {
        detail: { subscriptionId }
      }));
    } catch (error) {
      console.error('useStripeSubscription: Cancel subscription error:', error);
      throw error;
    }
  }, [cancelSubscriptionMutation]);

  // Manual refresh function that forces immediate data refresh
  const forceRefreshSubscriptions = useCallback(async () => {
    console.log('Force refreshing subscription data...');
    
    // Invalidate all subscription-related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
      queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
      queryClient.invalidateQueries({ queryKey: ['active-subscribers'] }),
      queryClient.invalidateQueries({ queryKey: ['enhancedSubscriptionCheck'] }),
    ]);
    
    // Force immediate refetch
    await refetchSubscriptions();
    
    return true;
  }, [queryClient, refetchSubscriptions]);

  return {
    userSubscriptions,
    subscriptionsLoading,
    createSubscription,
    cancelSubscription,
    isProcessing,
    setIsProcessing,
    refetchSubscriptions: forceRefreshSubscriptions,
  };
};
