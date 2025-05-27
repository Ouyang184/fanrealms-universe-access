
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useStripeSubscription = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user's subscriptions with more frequent updates
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['userSubscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching user subscriptions for user:', user.id);
      
      const { data, error } = await supabase
        .from('creator_subscriptions')
        .select(`
          *,
          creator:creators(
            id,
            display_name,
            bio,
            profile_image_url,
            banner_url,
            users!creators_user_id_fkey(
              username,
              profile_picture
            )
          ),
          tier:membership_tiers(
            id,
            title,
            price,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user subscriptions:', error);
        throw error;
      }
      
      console.log('Fetched user subscriptions:', data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
  });

  // Create subscription
  const { mutateAsync: createSubscription } = useMutation({
    mutationFn: async ({ tierId, creatorId }: { tierId: string, creatorId: string }) => {
      console.log('Creating subscription via Supabase function...', { tierId, creatorId });
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: { action: 'create_subscription', tierId, creatorId }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }
      
      if (!data) {
        console.error('No data returned from subscription function');
        throw new Error('No response data received');
      }

      return data;
    },
    onSuccess: async (data, variables) => {
      console.log('Subscription creation successful, invalidating queries and triggering immediate refresh');
      
      // Invalidate all subscription-related queries immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['active-subscribers'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
        queryClient.invalidateQueries({ queryKey: ['tiers'] }),
      ]);
      
      // Force immediate refetch
      await refetchSubscriptions();
      
      // Dispatch custom events for other components to listen to
      window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
        detail: { creatorId: variables.creatorId, tierId: variables.tierId }
      }));
      
      // Additional delayed refreshes to ensure consistency
      setTimeout(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
          queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
        ]);
        await refetchSubscriptions();
      }, 2000);
      
      setTimeout(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
          queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
        ]);
        await refetchSubscriptions();
      }, 5000);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Cancel subscription
  const { mutate: cancelSubscription } = useMutation({
    mutationFn: async (subscriptionId: string) => {
      console.log('Cancelling subscription:', subscriptionId);
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: { action: 'cancel_subscription', subscriptionId }
      });

      if (error) {
        console.error('Error cancelling subscription:', error);
        throw error;
      }
      return data;
    },
    onSuccess: async () => {
      console.log('Subscription cancelled successfully, refreshing data');
      
      // Invalidate all subscription-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['active-subscribers'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorMembershipTiers'] }),
        queryClient.invalidateQueries({ queryKey: ['userCreatorSubscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['userTierSubscription'] }),
        queryClient.invalidateQueries({ queryKey: ['tiers'] }),
      ]);
      
      // Force immediate refetch
      await refetchSubscriptions();
      
      // Dispatch custom event for unsubscribe
      window.dispatchEvent(new CustomEvent('subscriptionCanceled'));
      
      toast({
        title: "Success",
        description: "Subscription canceled successfully.",
      });
    },
    onError: (error) => {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    userSubscriptions,
    subscriptionsLoading,
    createSubscription,
    cancelSubscription,
    isProcessing,
    setIsProcessing,
    refetchSubscriptions
  };
};
