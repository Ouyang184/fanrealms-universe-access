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
  
  // Fetch creator's details including follower count and commission fields
  const { 
    data: creator, 
    isLoading: isLoadingCreator,
    error: creatorError
  } = useQuery({
    queryKey: ['creatorProfileDetails', user?.id],
    queryFn: async () => {
      if (!user?.id || !creatorProfile) return null;
      
      console.log('[useCreatorProfileData] Fetching creator profile details for user:', user.id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (userError || !userData) {
        console.error('[useCreatorProfileData] Error fetching user:', userError);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive"
        });
        return null;
      }
      
      // Get the latest creator data including all commission fields
      const { data: latestCreatorData, error: creatorError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (creatorError) {
        console.error('[useCreatorProfileData] Error fetching latest creator data:', creatorError);
      }
      
      const creatorProfileData = {
        ...creatorProfile,
        ...latestCreatorData, // This will include all commission fields
        username: userData.username,
        fullName: userData.username,
        displayName: latestCreatorData?.display_name || userData.username,
        email: userData.email,
        avatar_url: userData.profile_picture,
        banner_url: latestCreatorData?.banner_url || null,
        bio: latestCreatorData?.bio || "No bio provided yet.",
        display_name: latestCreatorData?.display_name || null,
        follower_count: latestCreatorData?.follower_count || 0,
        // Commission fields - ensure they're properly mapped
        accepts_commissions: latestCreatorData?.accepts_commissions || false,
        commission_base_rate: latestCreatorData?.commission_base_rate,
        commission_turnaround_days: latestCreatorData?.commission_turnaround_days,
        commission_slots_available: latestCreatorData?.commission_slots_available,
        commission_tos: latestCreatorData?.commission_tos
      } as CreatorProfile & { displayName: string };
      
      console.log('[useCreatorProfileData] Creator profile data assembled:', {
        id: creatorProfileData.id,
        accepts_commissions: creatorProfileData.accepts_commissions,
        commission_base_rate: creatorProfileData.commission_base_rate,
        hasCommissionData: !!(creatorProfileData.accepts_commissions || creatorProfileData.commission_base_rate)
      });
      
      return creatorProfileData;
    },
    enabled: !!user?.id && !!creatorProfile,
    retry: 3,
    retryDelay: 1000
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
      
      console.log('[useCreatorProfileData] Raw posts data:', {
        postsCount: postsData?.length,
        samplePosts: postsData?.slice(0, 2).map(p => ({ 
          id: p.id, 
          title: p.title, 
          tier_id: p.tier_id,
          author_id: p.author_id
        }))
      });
      
      // CRITICAL FIX: Ensure proper authorId mapping for creator access logic
      return postsData.map((post: any) => {
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
        .rpc('get_public_membership_tiers', { p_creator_id: creatorProfile.id });
      
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
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        const { count, error: countError } = await supabase
          .from('user_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id)
          .eq('status', 'active');
          
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
    enabled: !!creatorProfile?.id
  });
  
  // Log any errors for debugging
  if (creatorError) {
    console.error('[useCreatorProfileData] Creator query error:', creatorError);
  }
  
  return {
    creator,
    posts,
    tiers,
    isLoadingCreator,
    isLoadingPosts,
    isLoadingTiers,
    error: creatorError
  };
}
