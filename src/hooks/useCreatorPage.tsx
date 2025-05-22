
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { toast } from "@/hooks/use-toast";
import { CreatorProfile } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";

export function useCreatorPage(username?: string) {
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useAuth();
  
  console.log("useCreatorPage called with username:", username);
  
  // Fetch creator profile by username
  const {
    data: creator,
    isLoading: isLoadingCreator,
    error: creatorError,
    refetch: refetchCreator
  } = useQuery({
    queryKey: ['creatorProfile', username],
    queryFn: async () => {
      if (!username) {
        console.log("No username provided to useCreatorPage");
        return null;
      }
      
      console.log(`Fetching creator profile for username: "${username}"`);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError || !userData) {
        console.error('Error fetching user by username:', userError);
        throw new Error(`User with username "${username}" not found`);
      }
      
      console.log("Found user by username:", userData);
      
      // Fetch creator's additional details from creators table
      const { data: creatorInfoData, error: creatorInfoError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', userData.id)
        .single();
      
      if (creatorInfoError) {
        console.error('Error fetching creator info:', creatorInfoError);
        // Continue anyway as we may still have basic user data
      }
      
      // Merge the data and prioritize display_name
      const creatorProfile = {
        ...userData,
        ...creatorInfoData,
        fullName: creatorInfoData?.display_name || userData.username,
        display_name: creatorInfoData?.display_name || null,
      } as CreatorProfile;
      
      console.log("Constructed creator profile:", creatorProfile);
      return creatorProfile;
    },
    enabled: !!username,
    retry: 2,
    staleTime: 60000 // Cache results for 1 minute
  });
  
  // Fetch creator's posts
  const {
    data: posts = [],
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['creatorPosts', creator?.id],
    queryFn: async () => {
      if (!creator?.id) {
        console.log("No creator ID available for fetching posts");
        return [];
      }
      
      console.log(`Fetching posts for creator ID: ${creator.id}`);
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', creator.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive"
        });
        return [];
      }
      
      return postsData.map((post: any) => ({
        ...post,
        authorName: creator.display_name || post.users.username, // Use display_name if available
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at)
      }));
    },
    enabled: !!creator?.id,
    staleTime: 60000 // Cache results for 1 minute
  });
  
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
  const refreshCreatorData = useCallback(() => {
    if (username) {
      refetchCreator();
      if (creator?.id) {
        refetchPosts();
      }
    }
  }, [username, creator?.id, refetchCreator, refetchPosts]);

  // Initialize follow status 
  useEffect(() => {
    if (creator?.id && user?.id) {
      checkFollowStatus(creator.id).then(status => {
        setIsFollowing(status);
      });
    }
  }, [creator?.id, user?.id, checkFollowStatus, setIsFollowing]);

  // Handle follow toggle function
  const handleFollowToggle = async () => {
    if (!creator?.id) return;
    
    if (isFollowing) {
      await unfollowCreator(creator.id);
    } else {
      await followCreator(creator.id);
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
