
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useSubscriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's active subscriptions
  const { data: userSubscriptions, isLoading: subscriptionsLoading, refetch } = useQuery({
    queryKey: ['user-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching subscriptions for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          creator:creators (
            id,
            display_name,
            profile_image_url,
            users (
              username
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
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        return [];
      }

      console.log('Found subscriptions:', data?.length || 0, data);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ tierId, creatorId }: { tierId: string; creatorId: string }) => {
      console.log('Creating subscription for tier:', tierId, 'creator:', creatorId);
      
      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'create_subscription',
          tierId,
          creatorId
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      if (data?.clientSecret) {
        console.log('Subscription created, redirecting to payment');
      } else if (data?.error) {
        // Already subscribed case
        refetch();
        queryClient.invalidateQueries({ queryKey: ['subscription-check'] });
      }
    },
    onError: (error) => {
      console.error('Create subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : 'Failed to create subscription',
        variant: "destructive"
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      console.log('Cancelling subscription:', subscriptionId);
      
      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'cancel_subscription',
          subscriptionId
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
      
      // Refresh data immediately
      refetch();
      queryClient.invalidateQueries({ queryKey: ['subscription-check'] });
      queryClient.invalidateQueries({ queryKey: ['simple-creator-subscribers'] });
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('subscriptionCancelled'));
    },
    onError: (error) => {
      console.error('Cancel subscription error:', error);
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : 'Failed to cancel subscription',
        variant: "destructive"
      });
    }
  });

  // Manual refresh function
  const refreshSubscriptions = async () => {
    console.log('Manually refreshing subscriptions...');
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-creator-subscribers'] })
    ]);
  };

  return {
    userSubscriptions,
    subscriptionsLoading,
    createSubscription: createSubscriptionMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    isCreating: createSubscriptionMutation.isPending,
    isCancelling: cancelSubscriptionMutation.isPending,
    refetchSubscriptions: refreshSubscriptions
  };
};
