
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

  const clearOptimisticStateAfterDelay = (
    creatorId: string,
    setOptimisticFollowerCount: (value: number | null) => void,
    isUnfollow: boolean = false
  ) => {
    const delay = isUnfollow ? 1500 : 2000;
    
    setTimeout(() => {
      if (isUnfollow) {
        // Force a fresh fetch to get the actual count from the server
        queryClient.invalidateQueries({ queryKey: ["creatorProfile", creatorId] });
      }
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["creatorProfile"] });
      queryClient.invalidateQueries({ queryKey: ["creatorProfileDetails"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["creators"] });
      queryClient.invalidateQueries({ queryKey: ["followedCreators"] });
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      
      if (isUnfollow) {
        // Clear optimistic state only after cache is refreshed
        setTimeout(() => {
          setOptimisticFollowerCount(null);
        }, 500);
      } else {
        setOptimisticFollowerCount(null);
      }
    }, delay);
  };

  return {
    applyOptimisticFollowUpdate,
    revertOptimisticUpdate,
    clearOptimisticStateAfterDelay,
  };
}
