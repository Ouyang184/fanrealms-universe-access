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
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: { 
          action: 'get_user_subscriptions',
          userId: user.id 
        }
      });

      if (error) throw error;
      return data?.subscriptions || [];
    },
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000
  });

  // Create subscription - calls the stripe-subscriptions function
  const createSubscription = async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
    if (!user || isProcessing) return null;

    setIsProcessing(true);
    try {
      console.log('[useSimpleSubscriptions] Creating subscription for tier:', tierId, 'creator:', creatorId);
      
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'create_subscription',
          tierId: tierId,
          creatorId: creatorId
        }
      });

      if (error) {
        console.error('[useSimpleSubscriptions] Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      console.log('[useSimpleSubscriptions] Response:', data);
      
      if (data?.error) {
        console.error('[useSimpleSubscriptions] Subscription creation error:', data.error);
        
        if (data.shouldRefresh) {
          // Refresh subscription data if user is already subscribed
          await Promise.all([
            refetchSubscriptions(),
            queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
            queryClient.invalidateQueries({ queryKey: ['simple-creator-subscribers'] })
          ]);
        }
        return { error: data.error };
      }

      // Return checkout URL for redirect
      return data;
    } catch (error) {
      console.error('[useSimpleSubscriptions] Create subscription error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async (tierId: string, creatorId: string, immediate = false) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'cancel_subscription',
          tierId,
          creatorId,
          immediate
        }
      });

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: immediate ? "Your subscription has been cancelled immediately." : "Your subscription will end at the current period.",
      });

      // Refresh data
      await Promise.all([
        refetchSubscriptions(),
        queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
        queryClient.invalidateQueries({ queryKey: ['simple-creator-subscribers'] })
      ]);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('subscriptionCancelled', {
        detail: { tierId, creatorId }
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
