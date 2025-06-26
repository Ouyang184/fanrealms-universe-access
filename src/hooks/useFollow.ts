
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useFollow = () => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkFollowStatus = async (creatorId: string) => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', user.id as any)
        .eq('creator_id', creatorId as any)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  const getFollowerCount = async (creatorId: string) => {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('follower_count')
        .eq('id', creatorId as any)
        .single();

      if (error) {
        console.error('Error fetching follower count:', error);
        return 0;
      }

      return (data as any)?.follower_count || 0;
    } catch (error) {
      console.error('Error fetching follower count:', error);
      return 0;
    }
  };

  const followCreator = async (creatorId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to follow creators",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .insert([{
          user_id: user.id,
          creator_id: creatorId
        } as any]);

      if (error) {
        throw error;
      }

      setIsFollowing(true);
      toast({
        title: "Success",
        description: "You are now following this creator",
      });
    } catch (error: any) {
      console.error('Error following creator:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow creator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unfollowCreator = async (creatorId: string) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', user.id as any)
        .eq('creator_id', creatorId as any);

      if (error) {
        throw error;
      }

      setIsFollowing(false);
      
      // Get updated follower count
      const followerCount = await getFollowerCount(creatorId);
      
      toast({
        title: "Success",
        description: "You have unfollowed this creator",
      });
    } catch (error: any) {
      console.error('Error unfollowing creator:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow creator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    isLoading,
    setIsFollowing,
    checkFollowStatus,
    followCreator,
    unfollowCreator,
  };
};
