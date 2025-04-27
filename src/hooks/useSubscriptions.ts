
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Subscription } from '@/types';

export const useSubscriptions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's subscriptions
  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          creator:creators(
            id,
            user_id,
            bio,
            profile_image_url,
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
        `);

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      return data;
    },
  });

  // Subscribe/Follow a creator
  const { mutate: subscribe } = useMutation({
    mutationFn: async ({ creatorId, tierId }: { creatorId: string, tierId?: string }) => {
      if (!user) throw new Error("User must be logged in to subscribe");
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          creator_id: creatorId,
          user_id: user.id,
          tier_id: tierId,
          is_paid: !!tierId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: "Subscribed successfully",
        description: "You are now following this creator",
      });
    },
    onError: (error) => {
      console.error('Error subscribing:', error);
      toast({
        title: "Failed to subscribe",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Unsubscribe/Unfollow a creator
  const { mutate: unsubscribe } = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: "Unsubscribed successfully",
        description: "You are no longer following this creator",
      });
    },
    onError: (error) => {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Failed to unsubscribe",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  return {
    subscriptions,
    loadingSubscriptions,
    subscribe,
    unsubscribe,
  };
};
