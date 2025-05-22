import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { toast } from "@/hooks/use-toast";
import { CreatorProfile } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useNavigate } from "react-router-dom";

export function useCreatorPage(identifier?: string) {
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useAuth();
  const navigate = useNavigate();
  
  console.log("useCreatorPage called with identifier:", identifier);
  
  // Clean the identifier - remove "user-" prefix if present
  const cleanIdentifier = identifier?.startsWith('user-') 
    ? identifier.substring(5) // Remove "user-" prefix
    : identifier;
  
  // Fetch creator profile by username or id
  const {
    data: creator,
    isLoading: isLoadingCreator,
    error: creatorError,
    refetch: refetchCreator
  } = useQuery({
    queryKey: ['creatorProfile', cleanIdentifier],
    queryFn: async () => {
      if (!cleanIdentifier) {
        console.log("No identifier provided to useCreatorPage");
        return null;
      }
      
      console.log(`Fetching creator profile for cleaned identifier: "${cleanIdentifier}"`);
      
      // Strategy 1: Try to find by username
      const { data: userByUsername, error: usernameError } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanIdentifier)
        .maybeSingle();
      
      if (userByUsername) {
        console.log("Found user by username:", userByUsername);
        const userId = userByUsername.id;
        
        // Get creator info for this user
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (creatorData) {
          console.log("Found creator info for username:", creatorData);
          
          // Build and return the combined profile
          return {
            ...creatorData,
            ...userByUsername,
            id: userId,
            fullName: creatorData.display_name || userByUsername.username,
            display_name: creatorData.display_name || userByUsername.username,
            username: userByUsername.username,
            avatar_url: userByUsername.profile_picture || null,
          } as CreatorProfile;
        }
      }
      
      // Strategy 2: Try to find creator directly by user_id (using the cleaned identifier)
      const { data: creatorByUserId, error: userIdError } = await supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            id,
            username,
            email,
            profile_picture
          )
        `)
        .eq('user_id', cleanIdentifier)
        .maybeSingle();
        
      if (creatorByUserId && creatorByUserId.users) {
        console.log("Found creator by user_id:", creatorByUserId);
        
        return {
          ...creatorByUserId,
          id: creatorByUserId.user_id,
          username: creatorByUserId.users.username || `user-${creatorByUserId.user_id.substring(0, 8)}`,
          email: creatorByUserId.users.email || "",
          fullName: creatorByUserId.display_name || creatorByUserId.users.username,
          display_name: creatorByUserId.display_name || creatorByUserId.users.username,
          avatar_url: creatorByUserId.users.profile_picture || null,
        } as CreatorProfile;
      }
      
      // Strategy 3: Try to find by display_name
      const { data: creatorsWithDisplayName, error: displayNameError } = await supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            id,
            username,
            email,
            profile_picture
          )
        `)
        .ilike('display_name', cleanIdentifier)
        .limit(1);
        
      if (creatorsWithDisplayName && creatorsWithDisplayName.length > 0) {
        const creatorByDisplayName = creatorsWithDisplayName[0];
        console.log("Found creator by display_name:", creatorByDisplayName);
        
        return {
          ...creatorByDisplayName,
          id: creatorByDisplayName.user_id,
          username: creatorByDisplayName.users?.username || `user-${creatorByDisplayName.user_id.substring(0, 8)}`,
          email: creatorByDisplayName.users?.email || "",
          fullName: creatorByDisplayName.display_name || creatorByDisplayName.users?.username,
          display_name: creatorByDisplayName.display_name || creatorByDisplayName.users?.username,
          avatar_url: creatorByDisplayName.users?.profile_picture || null,
        } as CreatorProfile;
      }
      
      // If nothing found, try to find creator by raw "user-id" format
      if (identifier && identifier.startsWith('user-')) {
        console.log("Trying to find creator with original user- prefix:", identifier);
        const { data: creators, error: rawIdError } = await supabase
          .from('creators')
          .select(`
            *,
            users!creators_user_id_fkey (
              id,
              username,
              email,
              profile_picture
            )
          `)
          .limit(100); // Get all creators and filter client-side
          
        if (creators && creators.length > 0) {
          // Find by constructing the "user-id" format and comparing
          const creator = creators.find(c => 
            `user-${c.user_id.substring(0, 8)}` === identifier
          );
          
          if (creator) {
            console.log("Found creator by prefix match:", creator);
            return {
              ...creator,
              id: creator.user_id,
              username: creator.users?.username || `user-${creator.user_id.substring(0, 8)}`,
              email: creator.users?.email || "",
              fullName: creator.display_name || creator.users?.username,
              display_name: creator.display_name || creator.users?.username,
              avatar_url: creator.users?.profile_picture || null,
            } as CreatorProfile;
          }
        }
      }
      
      // If we've exhausted all lookup methods and still can't find the creator
      console.error('Creator not found by any lookup method:', identifier);
      
      // Instead of throwing an error, inform the user through toast and redirect
      toast({
        title: "Creator not found",
        description: `We couldn't find a creator with the identifier: ${identifier}`,
        variant: "destructive"
      });
      
      // Return null instead of throwing to prevent error loops
      return null;
    },
    enabled: !!identifier,
    retry: 1,
    staleTime: 30000, // Cache results for 30 seconds
    refetchOnWindowFocus: false
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
        authorName: creator.display_name || post.users?.username || 'Unknown', 
        authorAvatar: post.users?.profile_picture,
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
    if (identifier) {
      refetchCreator();
      if (creator?.id) {
        refetchPosts();
      }
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
    posts: [],
    activeTab,
    setActiveTab,
    isLoadingCreator,
    isLoadingPosts: false,
    isFollowing: false,
    followLoading: false,
    handleFollowToggle: async () => {},
    refreshCreatorData: refetchCreator
  };
}
