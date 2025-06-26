
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
  
  // Fetch creator's details including follower count
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
        .eq('id', user.id as any)
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
      
      // Get the latest creator data including follower_count
      const { data: latestCreatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id as any)
        .single();
      
      if (creatorError) {
        console.error('Error fetching latest creator data:', creatorError);
      }
      
      // Ensure both objects exist before spreading
      const baseProfile = creatorProfile || {};
      const latestData = latestCreatorData as any || {};
      const userDataSafe = userData as any;
      
      return {
        ...baseProfile,
        ...latestData,
        username: userDataSafe.username,
        fullName: userDataSafe.username,
        displayName: latestData.display_name || userDataSafe.username,
        email: userDataSafe.email,
        avatar_url: userDataSafe.profile_picture,
        banner_url: latestData.banner_url || null,
        bio: latestData.bio || "No bio provided yet.",
        display_name: latestData.display_name || null,
        follower_count: latestData.follower_count || 0
      } as CreatorProfile & { displayName: string };
    },
    enabled: !!user?.id && !!creatorProfile
  });
  
  // Fetch all creator's posts (including public ones)
  const {
    data: posts = [], 
    isLoading: isLoadingPosts,
  } = useQuery({
    queryKey: ['creatorProfilePosts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[useCreatorProfileData] Fetching posts for creator user ID:', user.id);
      
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          users:author_id (
            username,
            profile_picture
          ),
          membership_tiers (
            id,
            title,
            price
          )
        `)
        .eq('author_id', user.id as any)
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
      
      console.log('[useCreatorProfileData] Raw posts data:', {
        postsCount: postsData?.length,
        samplePosts: postsData?.slice(0, 2).map(p => ({ 
          id: (p as any).id, 
          title: (p as any).title, 
          tier_id: (p as any).tier_id,
          author_id: (p as any).author_id
        }))
      });
      
      // CRITICAL FIX: Ensure proper authorId mapping for creator access logic
      return (postsData as any).map((post: any) => {
        const mappedPost = {
          ...post,
          authorId: post.author_id, // CRITICAL FIX: Map database field to frontend field
          authorName: post.users?.username || 'Unknown',
          authorAvatar: post.users?.profile_picture,
          date: formatRelativeDate(post.created_at),
          tierInfo: post.membership_tiers
        } as Post;
        
        console.log('[useCreatorProfileData] ENHANCED Mapped post with creator access logic:', {
          id: mappedPost.id,
          title: mappedPost.title,
          authorId: mappedPost.authorId,
          authorIdType: typeof mappedPost.authorId,
          authorIdValue: JSON.stringify(mappedPost.authorId),
          tier_id: mappedPost.tier_id,
          rawAuthorId: post.author_id,
          message: 'Creator profile post mapped with consistent authorId for creator access logic'
        });
        
        return mappedPost;
      });
    },
    enabled: !!user?.id
  });

  // Fetch membership tiers with proper structure
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
        .eq('creator_id', (creatorProfile as any).id as any)
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
      
      // Count subscribers for each tier and format properly
      const tiersWithSubscribers = await Promise.all((tiersData as any).map(async (tier: any) => {
        const { count, error: countError } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id as any);
          
        return {
          id: tier.id,
          name: tier.title,
          title: tier.title,
          price: tier.price,
          description: tier.description,
          features: tier.description ? [tier.description] : [],
          subscriberCount: count || 0
        };
      }));
      
      return tiersWithSubscribers;
    },
    enabled: !!(creatorProfile as any)?.id
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
