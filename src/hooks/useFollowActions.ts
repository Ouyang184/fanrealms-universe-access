
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useFollowActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('follows')
        .insert([{
          user_id: user.id as any,
          creator_id: creatorId as any
        } as any]);

      if (error) throw error;
      return creatorId;
    },
    onSuccess: (creatorId) => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['followedCreators'] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', creatorId] });
      toast({
        title: "Success",
        description: "You are now following this creator",
      });
    },
    onError: (error: any) => {
      console.error('Error following creator:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow creator",
        variant: "destructive",
      });
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First get creator details to show in notification
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('id, user_id, display_name, users:user_id(username), follower_count')
        .eq('id', creatorId as any)
        .single();

      if (creatorError) {
        console.error('Error fetching creator for unfollow:', creatorError);
        // Continue with unfollow even if we can't fetch creator details
      }

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', user.id as any)
        .eq('creator_id', creatorId as any);

      if (error) throw error;

      // If we have creator data, show their name in the success message
      const creatorName = creator ? 
        ((creator as any).display_name || (creator as any).users?.username || 'Creator') :
        'Creator';

      return { creatorId, creatorName };
    },
    onSuccess: ({ creatorId, creatorName }) => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['followedCreators'] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', creatorId] });
      toast({
        title: "Success",
        description: `You have unfollowed ${creatorName}`,
      });
    },
    onError: (error: any) => {
      console.error('Error unfollowing creator:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow creator",
        variant: "destructive",
      });
    }
  });

  const batchFollowMutation = useMutation({
    mutationFn: async (creatorIds: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const followData = creatorIds.map(creatorId => ({
        user_id: user.id,
        creator_id: creatorId
      }));

      const { error } = await supabase
        .from('follows')
        .insert(followData as any);

      if (error) throw error;
      return creatorIds;
    },
    onSuccess: (creatorIds) => {
      queryClient.invalidateQueries({ queryKey: ['follows'] });
      queryClient.invalidateQueries({ queryKey: ['followedCreators'] });
      creatorIds.forEach(creatorId => {
        queryClient.invalidateQueries({ queryKey: ['creatorProfile', creatorId] });
      });
      toast({
        title: "Success",
        description: `You are now following ${creatorIds.length} creators`,
      });
    },
    onError: (error: any) => {
      console.error('Error batch following creators:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow creators",
        variant: "destructive",
      });
    }
  });

  return {
    followCreator: followMutation.mutate,
    unfollowCreator: unfollowMutation.mutate,
    batchFollowCreators: batchFollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
    isBatchFollowing: batchFollowMutation.isPending,
  };
};
