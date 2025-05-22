
import { useState, useEffect } from "react";
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
  
  // Fetch creator profile by username
  const {
    data: creator,
    isLoading: isLoadingCreator,
  } = useQuery({
    queryKey: ['creatorProfile', username],
    queryFn: async () => {
      if (!username) return null;
      
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (creatorError || !creatorData) {
        console.error('Error fetching creator:', creatorError);
        toast({
          title: "Error",
          description: "Failed to load creator profile",
          variant: "destructive"
        });
        return null;
      }
      
      // Fetch creator's additional details from creators table
      const { data: creatorInfoData, error: creatorInfoError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', creatorData.id)
        .single();
      
      if (creatorInfoError) {
        console.error('Error fetching creator info:', creatorInfoError);
      }
      
      // Merge the data and prioritize display_name
      return {
        ...creatorData,
        ...creatorInfoData,
        fullName: creatorInfoData?.display_name || creatorData.username,
        // Ensure display_name is explicitly available
        display_name: creatorInfoData?.display_name || null
      } as CreatorProfile;
    },
    enabled: !!username
  });
  
  // Fetch creator's posts
  const {
    data: posts = [],
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['creatorPosts', creator?.id],
    queryFn: async () => {
      if (!creator?.id) return [];
      
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
    enabled: !!creator?.id
  });
  
  // Handle following/unfollowing functionality
  const { 
    isFollowing, 
    isLoading, 
    setIsFollowing,
    checkFollowStatus,
    followCreator,
    unfollowCreator
  } = useFollow();

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
  
  return {
    creator,
    posts,
    activeTab,
    setActiveTab,
    isLoadingCreator,
    isLoadingPosts,
    isFollowing,
    followLoading: isLoading, // Renamed from isLoading to followLoading for clarity
    handleFollowToggle
  };
}
