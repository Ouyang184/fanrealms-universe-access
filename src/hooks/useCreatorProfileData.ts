
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { CreatorProfile, Post } from "@/types";
import { toast } from "@/hooks/use-toast";
import { formatRelativeDate } from "@/utils/auth-helpers";

export function useCreatorProfileData() {
  const { user } = useAuth();
  const { creatorProfile } = useCreatorProfile();
  
  // Fetch creator's details
  const { 
    data: creator, 
    isLoading: isLoadingCreator,
  } = useQuery({
    queryKey: ['creatorProfileDetails', user?.id],
    queryFn: async () => {
      if (!user?.id || !creatorProfile) return null;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
        return null;
      }
      
      return {
        ...creatorProfile,
        username: userData.username,
        fullName: userData.username,
        displayName: creatorProfile.display_name || userData.username,
        email: userData.email,
        avatar_url: userData.profile_picture,
        banner_url: creatorProfile.banner_url || null,
        bio: creatorProfile.bio || "No bio provided yet.",
        display_name: creatorProfile.display_name || null
      } as CreatorProfile & { displayName: string };
    },
    enabled: !!user?.id && !!creatorProfile
  });
  
  // Fetch creator's posts
  const {
    data: posts = [], 
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['creatorProfilePosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          )
        `)
        .eq('author_id', user.id)
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
    enabled: !!user?.id
  });

  // Fetch membership tiers
  const {
    data: tiers = [],
    isLoading: isLoadingTiers,
  } = useQuery({
    queryKey: ['creatorProfileTiers', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      const { data: tiersData, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('price', { ascending: true });
      
      if (error) {
        console.error('Error fetching tiers:', error);
        toast({
          title: "Error",
          description: "Failed to load membership tiers",
          variant: "destructive"
        });
        return [];
      }
      
      // Count subscribers for each tier
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        const { count, error: countError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id);
          
        return {
          ...tier,
          name: tier.title,
          features: [tier.description],
          subscriberCount: count || 0
        };
      }));
      
      return tiersWithSubscribers;
    },
    enabled: !!creatorProfile?.id
  });
  
  return {
    creator,
    posts,
    tiers,
    isLoadingCreator,
    isLoadingPosts,
    isLoadingTiers
  };
}
