import { useFollowState } from "./useFollowState";
import { useFollowActions } from "./useFollowActions";
import { useFollowOptimisticUpdates } from "./useFollowOptimisticUpdates";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useFollow() {
  const { toast } = useToast();
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

  const {
    applyOptimisticFollowUpdate,
    revertOptimisticUpdate,
    clearOptimisticStateAfterDelay,
  } = useFollowOptimisticUpdates();

  // Function to follow a creator using follows table with optimistic updates
  const followCreator = async (creatorId: string): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Get current creator data for optimistic update
    let currentFollowerCount = 0;
    try {
      const { data: creator, error } = await supabase
        .from("creators")
        .select("follower_count")
        .eq("id", creatorId)
        .single();
      
      if (error) {
        console.error("Error fetching creator:", error);
        setIsLoading(false);
        return;
      }

      currentFollowerCount = creator.follower_count || 0;
      
      // Apply optimistic update
      applyOptimisticFollowUpdate(
        creatorId,
        currentFollowerCount,
        true,
        setIsFollowing,
        setOptimisticFollowerCount
      );
      
    } catch (error) {
      console.error("Error checking creator ownership:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to follow creator",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await performFollowOperation(creatorId);
      
      if (result.alreadyFollowing) {
        // Keep optimistic state as user is already following
        setIsFollowing(true);
      }
      
      // Clear optimistic state after delay
      clearOptimisticStateAfterDelay(creatorId, setOptimisticFollowerCount);
      
    } catch (error: any) {
      console.error("Error following creator:", error);
      // Revert optimistic update on error
      revertOptimisticUpdate(
        creatorId,
        currentFollowerCount,
        false,
        setIsFollowing,
        setOptimisticFollowerCount
      );
      toast({
        title: "Error",
        description: error.message || "Failed to follow creator",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to unfollow a creator using follows table with optimistic updates
  const unfollowCreator = async (creatorId: string): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Get current follower count for optimistic update
    let currentFollowerCount = 0;
    try {
      const { data: creator } = await supabase
        .from("creators")
        .select("follower_count")
        .eq("id", creatorId)
        .single();
      
      currentFollowerCount = creator?.follower_count || 0;
      
      // Apply optimistic update
      applyOptimisticFollowUpdate(
        creatorId,
        currentFollowerCount,
        false,
        setIsFollowing,
        setOptimisticFollowerCount
      );
      
    } catch (error) {
      console.error("Error getting creator data for optimistic update:", error);
    }
    
    try {
      await performUnfollowOperation(creatorId);
      
      // Clear optimistic state after delay with unfollow-specific timing
      clearOptimisticStateAfterDelay(creatorId, setOptimisticFollowerCount, true);
      
    } catch (error: any) {
      console.error("Error unfollowing creator:", error);
      // Revert optimistic update on error
      revertOptimisticUpdate(
        creatorId,
        currentFollowerCount,
        true,
        setIsFollowing,
        setOptimisticFollowerCount
      );
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
