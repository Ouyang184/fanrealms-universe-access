
import { useState } from "react";

export function useFollowState() {
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimisticFollowerCount, setOptimisticFollowerCount] = useState<number | null>(null);

  return {
    isFollowing,
    setIsFollowing,
    isLoading,
    setIsLoading,
    optimisticFollowerCount,
    setOptimisticFollowerCount,
  };
}
