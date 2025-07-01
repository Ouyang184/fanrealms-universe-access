
import { useFollowState } from "./useFollowState";
import { useFollowActions } from "./useFollowActions";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useFollow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    isFollowing,
    setIsFollowing,
    isLoading,
    setIsLoading,
    optimisticFollowerCount,
    setOptimisticFollowerCount,
  } = useFollowState();

  const {
    checkFollowStatus,
    performFollowOperation,
    performUnfollowOperation,
  } = useFollowActions();

  // Function to follow a creator - simplified without optimistic updates
  const followCreator = async (creatorId: string): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const result = await performFollowOperation(creatorId);
      
      if (result.alreadyFollowing) {
        setIsFollowing(true);
      } else {
        setIsFollowing(true);
        
        // Invalidate and refetch all related queries to get fresh data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['creatorProfile'] }),
          queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails'] }),
          queryClient.invalidateQueries({ queryKey: ['follows'] }),
          queryClient.invalidateQueries({ queryKey: ['creators'] }),
        ]);
      }
      
    } catch (error: any) {
      console.error("Error following creator:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow creator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unfollow a creator - simplified without optimistic updates
  const unfollowCreator = async (creatorId: string): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      await performUnfollowOperation(creatorId);
      setIsFollowing(false);
      
      // Invalidate and refetch all related queries to get fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['creatorProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails'] }),
        queryClient.invalidateQueries({ queryKey: ['follows'] }),
        queryClient.invalidateQueries({ queryKey: ['creators'] }),
      ]);
      
    } catch (error: any) {
      console.error("Error unfollowing creator:", error);
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
    optimisticFollowerCount,
    setIsFollowing,
    setOptimisticFollowerCount,
    checkFollowStatus,
    followCreator,
    unfollowCreator,
  };
}
