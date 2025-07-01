
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { useCreatorFetch } from "@/hooks/useCreatorFetch";

export function useCreatorPage(identifier?: string) {
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useAuth();
  
  console.log("useCreatorPage called with identifier:", identifier);
  
  // Use the refactored creator fetching hook
  const {
    creator,
    posts,
    isLoadingCreator,
    isLoadingPosts,
    creatorError,
    refetchCreator,
    refetchPosts
  } = useCreatorFetch(identifier);
  
  // Handle following/unfollowing functionality
  const { 
    isFollowing, 
    isLoading: followStateLoading, 
    setIsFollowing,
    checkFollowStatus,
    followCreator,
    unfollowCreator
  } = useFollow();
  
  // Function to refresh creator data
  const refreshCreatorData = useCallback(async () => {
    if (identifier) {
      await Promise.all([
        refetchCreator(),
        creator?.id && refetchPosts()
      ]);
    }
  }, [identifier, creator?.id, refetchCreator, refetchPosts]);

  // Initialize follow status 
  useEffect(() => {
    if (creator?.id && user?.id) {
      checkFollowStatus(creator.id).then(status => {
        setIsFollowing(status);
      });
    }
  }, [creator?.id, user?.id, checkFollowStatus, setIsFollowing]);

  // Handle follow toggle function with automatic refresh
  const handleFollowToggle = async () => {
    if (!creator?.id) return;
    
    try {
      if (isFollowing) {
        await unfollowCreator(creator.id);
      } else {
        await followCreator(creator.id);
      }
      
      // Refresh creator data to get updated follower count
      await refreshCreatorData();
      
    } catch (error) {
      console.error("Error in follow toggle:", error);
    }
  };
  
  const followLoading = followStateLoading;
  
  if (creatorError) {
    console.error("Error in useCreatorPage:", creatorError);
  }
  
  return {
    creator,
    posts,
    activeTab,
    setActiveTab,
    isLoadingCreator,
    isLoadingPosts,
    isFollowing,
    followLoading,
    handleFollowToggle,
    refreshCreatorData
  };
}
