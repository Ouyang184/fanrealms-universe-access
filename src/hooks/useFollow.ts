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
    finalizeMutationAfterSuccess,
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
      
      // Finalize the mutation after success - no need to clear optimistic state since DB is updated
      setTimeout(() => {
        console.log("Clearing optimistic state after follow");
        setOptimisticFollowerCount(null);
      }, 500);
      
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
  const unfollowCreator = async (creatorId: string, currentDisplayedCount?: number): Promise<void> => {
    if (isLoading) return;
    setIsLoading(true);
    
    // Use the current displayed count if provided, otherwise fetch from database
    let currentFollowerCount = currentDisplayedCount;
    
    if (currentFollowerCount === undefined) {
      try {
        const { data: creator } = await supabase
          .from("creators")
          .select("follower_count")
          .eq("id", creatorId)
          .single();
        
        currentFollowerCount = creator?.follower_count || 0;
      } catch (error) {
        console.error("Error getting creator data for optimistic update:", error);
        currentFollowerCount = 0;
      }
    }
    
    console.log("Unfollowing with current count:", currentFollowerCount);
    
    // Apply optimistic update
    applyOptimisticFollowUpdate(
      creatorId,
      currentFollowerCount,
      false,
      setIsFollowing,
      setOptimisticFollowerCount
    );
    
    try {
      const result = await performUnfollowOperation(creatorId);
      
      // Since the database is updated, just clear optimistic state after a short delay
      setTimeout(() => {
        console.log("Clearing optimistic state after unfollow");
        setOptimisticFollowerCount(null);
      }, 500);
      
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
