
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useFollow } from "@/hooks/useFollow";
import type { CreatorProfile, Post } from "@/types";

export function useCreatorPage(username: string | undefined) {
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();
  const { 
    followCreator, 
    unfollowCreator, 
    isFollowing, 
    setIsFollowing, 
    isLoading: followLoading, 
    checkFollowStatus 
  } = useFollow();

  const { 
    data: creator, 
    isLoading: isLoadingCreator,
    refetch: refetchCreator
  } = useQuery({
    queryKey: ['creatorProfile', username],
    queryFn: async () => {
      if (!username) return null;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        toast({
          title: "Error",
          description: "Creator not found",
          variant: "destructive"
        });
        return null;
      }
      
      const { data: creatorData, error: creatorError } = await supabase
        .from('creators')
        .select(`
          *,
          membership_tiers (
            id, 
            title,
            description,
            price,
            created_at
          )
        `)
        .eq('user_id', userData.id)
        .single();
      
      if (creatorError && creatorError.code !== 'PGRST116') {
        console.error('Error fetching creator:', creatorError);
        toast({
          title: "Error",
          description: "Failed to load creator profile",
          variant: "destructive"
        });
        return null;
      }
      
      if (!creatorData) {
        return {
          id: "",
          user_id: userData.id,
          username: userData.username,
          fullName: userData.username,
          email: userData.email,
          avatar_url: userData.profile_picture,
          banner_url: null,
          bio: null,
          created_at: userData.created_at,
          tiers: []
        } as CreatorProfile;
      }
      
      return {
        ...creatorData,
        username: userData.username,
        fullName: userData.username,
        email: userData.email,
        avatar_url: userData.profile_picture,
        banner_url: creatorData.banner_url || null,
        tiers: creatorData.membership_tiers?.map((tier: any) => ({
          ...tier,
          name: tier.title,
          features: [tier.description]
        }))
      } as CreatorProfile;
    }
  });
  
  const {
    data: posts = [], 
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['creatorPosts', username],
    queryFn: async () => {
      if (!username) return [];
      
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();
      
      if (!userData) return [];
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', userData.id)
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
        authorName: post.users.username,
        authorAvatar: post.users.profile_picture,
        date: formatRelativeDate(post.created_at)
      })) as Post[];
    },
    enabled: !!username
  });

  useEffect(() => {
    if (creator?.user_id) {
      checkFollowStatus(creator.user_id).then(setIsFollowing);
    }
  }, [creator?.user_id, checkFollowStatus, setIsFollowing]);

  useEffect(() => {
    if (!username || !creator?.user_id) return;

    const creatorChannel = supabase
      .channel(`creator-${creator.user_id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'creators',
          filter: `user_id=eq.${creator.user_id}` 
        }, 
        () => {
          console.log('Creator profile changed, refreshing data');
          refetchCreator();
        }
      )
      .subscribe();

    const postsChannel = supabase
      .channel(`creator-posts-${creator.user_id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'posts',
          filter: `author_id=eq.${creator.user_id}` 
        }, 
        () => {
          console.log('Creator posts changed, refreshing data');
          refetchPosts();
        }
      )
      .subscribe();

    const tiersChannel = supabase
      .channel(`creator-tiers-${creator.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'membership_tiers',
          filter: creator.id ? `creator_id=eq.${creator.id}` : undefined
        }, 
        () => {
          console.log('Membership tiers changed, refreshing data');
          refetchCreator();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(creatorChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(tiersChannel);
    };
  }, [username, creator?.user_id, creator?.id, refetchCreator, refetchPosts]);

  const handleFollowToggle = async () => {
    if (!creator?.user_id) return;
    
    if (isFollowing) {
      await unfollowCreator(creator.user_id);
    } else {
      await followCreator(creator.user_id);
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
    followLoading,
    handleFollowToggle
  };
}
