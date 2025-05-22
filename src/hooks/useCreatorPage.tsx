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
  
  console.log("useCreatorPage called with username/id:", username);
  
  // Fetch creator profile by username or id
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
      
      console.log(`Fetching creator profile for identifier: "${username}"`);
      
      // First try to find by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      let userId;
      
      if (!userData) {
        console.log(`User not found by username "${username}", trying direct creator query...`);
        
        // Try to find a creator with display_name matching the username
        const { data: creatorByDisplayName, error: displayNameError } = await supabase
          .from('creators')
          .select('*')
          .ilike('display_name', username)
          .maybeSingle();
          
        if (creatorByDisplayName) {
          console.log("Found creator by display_name:", creatorByDisplayName);
          userId = creatorByDisplayName.user_id;
        } else {
          // As a last resort, try to find the creator directly by user_id
          const { data: creatorDirectById, error: directIdError } = await supabase
            .from('creators')
            .select('*')
            .eq('user_id', username)
            .maybeSingle();
            
          if (creatorDirectById) {
            console.log("Found creator directly by user_id:", creatorDirectById);
            userId = creatorDirectById.user_id;
          } else {
            console.error('Creator not found by any method:', username);
            throw new Error(`Creator "${username}" not found`);
          }
        }
      } else {
        console.log("Found user by username:", userData);
        userId = userData.id;
      }
      
      // Now fetch the creator's details from creators table using the user ID
      const { data: creatorInfoData, error: creatorInfoError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (creatorInfoError) {
        console.error('Error fetching creator info:', creatorInfoError);
        throw new Error(`Creator info for user ID "${userId}" not found`);
      }
      
      // Get user information for this creator
      const { data: userInfo, error: userInfoError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      // Merge the data
      const creatorProfile = {
        ...creatorInfoData,
        ...userInfo,
        fullName: creatorInfoData?.display_name || userInfo?.username,
        display_name: creatorInfoData?.display_name || userInfo?.username,
        username: userInfo?.username || `user-${userId.substring(0, 8)}`,
        avatar_url: userInfo?.profile_picture || null,
      } as CreatorProfile;
      
      console.log("Constructed creator profile:", creatorProfile);
      return creatorProfile;
    },
    enabled: !!username,
    retry: 2,
    staleTime: 30000 // Cache results for 30 seconds
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
