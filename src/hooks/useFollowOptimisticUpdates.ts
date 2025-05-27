
import { useQueryClient } from "@tanstack/react-query";

export function useFollowOptimisticUpdates() {
  const queryClient = useQueryClient();

  const applyOptimisticFollowUpdate = (
    creatorId: string,
    currentCount: number,
    isFollowing: boolean,
    setIsFollowing: (value: boolean) => void,
    setOptimisticFollowerCount: (value: number) => void
  ) => {
    const newCount = isFollowing ? currentCount + 1 : Math.max(currentCount - 1, 0);
    console.log("Applying optimistic update - setting follow to", isFollowing, "count from", currentCount, "to", newCount);
    
    setIsFollowing(isFollowing);
    setOptimisticFollowerCount(newCount);
    
    // Update cache optimistically
    queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
      if (oldData) {
        return {
          ...oldData,
          follower_count: newCount
        };
      }
      return oldData;
    });
  };

  const revertOptimisticUpdate = (
    creatorId: string,
    originalCount: number,
    originalFollowState: boolean,
    setIsFollowing: (value: boolean) => void,
    setOptimisticFollowerCount: (value: number | null) => void
  ) => {
    console.log("Reverting optimistic update back to:", originalCount, originalFollowState);
    setIsFollowing(originalFollowState);
    setOptimisticFollowerCount(null);
    
    queryClient.setQueryData(['creatorProfile', creatorId], (oldData: any) => {
      if (oldData) {
        return {
          ...oldData,
          follower_count: originalCount
        };
      }
      return oldData;
    });
  };

  const finalizeMutationAfterSuccess = (
    creatorId: string,
    newFollowState: boolean,
    setOptimisticFollowerCount: (value: number | null) => void
  ) => {
    console.log("Finalizing mutation for creator:", creatorId, "new follow state:", newFollowState);
    
    // Wait a bit for the server to process the change, then invalidate to get fresh data
    setTimeout(() => {
      console.log("Invalidating queries after successful mutation");
      queryClient.invalidateQueries({ queryKey: ["creatorProfile", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["creatorProfileDetails"] });
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      
      // Clear optimistic state after a longer delay to ensure server has processed
      setTimeout(() => {
        console.log("Clearing optimistic state");
        setOptimisticFollowerCount(null);
      }, 1000);
    }, 2000);
  };

  return {
    applyOptimisticFollowUpdate,
    revertOptimisticUpdate,
    finalizeMutationAfterSuccess,
  };
}
