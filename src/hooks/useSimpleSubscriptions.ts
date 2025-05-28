
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useSimpleSubscriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get user's active subscriptions
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['simple-user-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: { action: 'get_user_subscriptions' }
      });

      if (error) throw error;
      return data?.subscriptions || [];
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000
  });

  // Create subscription
  const createSubscription = async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    if (!user || isProcessing) return null;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'create_subscription',
          tierId,
          creatorId
        }
      });

      if (error) throw error;
      if (data?.error) {
        toast({
          title: "Already Subscribed",
          description: data.error,
        });
        return { error: data.error };
      }

      return data;
    } catch (error) {
      console.error('Create subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : 'Failed to create subscription',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async (subscriptionId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });

      // Refresh data
      await Promise.all([
        refetchSubscriptions(),
        queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
        queryClient.invalidateQueries({ queryKey: ['simple-creator-subscribers'] })
      ]);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('subscriptionCancelled', {
        detail: { subscriptionId }
      }));

    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: "destructive"
      });
    }
  };

  // Refresh all subscription data
  const refreshSubscriptions = async () => {
    await Promise.all([
      refetchSubscriptions(),
      queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-creator-subscribers'] })
    ]);
  };

  return {
    userSubscriptions,
    subscriptionsLoading,
    isProcessing,
    createSubscription,
    cancelSubscription,
    refreshSubscriptions,
    refetchSubscriptions
  };
};
