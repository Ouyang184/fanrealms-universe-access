
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Post, Creator } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";

export function useCreatorFetch(identifier?: string) {
  const { user } = useAuth();

  // Fetch creator data
  const {
    data: creator,
    isLoading: isLoadingCreator,
    error: creatorError,
    refetch: refetchCreator
  } = useQuery({
    queryKey: ['creator', identifier],
    queryFn: async (): Promise<Creator | null> => {
      if (!identifier) return null;
      
      console.log('[useCreatorFetch] Fetching creator with identifier:', identifier);
      
      // Try to fetch by username first, then by creator ID
      let query = supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            username,
            profile_picture
          )
        `);
      
      // Check if identifier looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      if (isUUID) {
        query = query.eq('id', identifier);
      } else {
        // First try to find by username in the users table
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('username', identifier)
          .single();
        
        if (userData) {
          query = query.eq('user_id', userData.id);
        } else {
          // If no user found, return null
          return null;
        }
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        console.error('[useCreatorFetch] Error fetching creator:', error);
        return null;
      }
      
      console.log('[useCreatorFetch] Creator data:', data);
      
      return {
        id: data.id,
        user_id: data.user_id,
        display_name: data.display_name,
        bio: data.bio,
        profile_image_url: data.profile_image_url,
        banner_url: data.banner_url,
        website: data.website,
        tags: data.tags || [],
        follower_count: data.follower_count || 0,
        is_nsfw: data.is_nsfw || false,
        created_at: data.created_at,
        stripe_account_id: data.stripe_account_id,
        stripe_onboarding_complete: data.stripe_onboarding_complete || false,
        stripe_charges_enabled: data.stripe_charges_enabled || false,
        stripe_payouts_enabled: data.stripe_payouts_enabled || false,
        username: data.users?.username || null,
        profile_picture: data.users?.profile_picture || null
      };
    },
    enabled: !!identifier
  });

  // Fetch creator's posts
  const {
    data: posts,
    isLoading: isLoadingPosts,
    refetch: refetchPosts
  } = useQuery({
    queryKey: ['creatorPosts', creator?.id],
    queryFn: async (): Promise<Post[]> => {
      if (!creator?.id) return [];
      
      console.log('[useCreatorFetch] Fetching posts for creator:', creator.id);
      
      const now = new Date().toISOString();
      const isOwnCreator = user?.id === creator.user_id;
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            username,
            profile_picture
          ),
          membership_tiers (
            id,
            title,
            price
          ),
          post_tiers (
            tier_id,
            membership_tiers (
              id,
              title,
              price
            )
          ),
          likes(count),
          comments(count)
        `)
        .eq('creator_id', creator.id)
        .order('created_at', { ascending: false });

      // If viewing own creator profile, show all posts including scheduled ones
      // If viewing someone else's profile, only show published posts and scheduled posts that have passed their time
      if (!isOwnCreator) {
        query = query.or(`status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${now})`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[useCreatorFetch] Error fetching posts:', error);
        return [];
      }
      
      console.log('[useCreatorFetch] Posts data:', data);
      
      return data.map((post): Post => {
        const userData = post.users as { username: string; profile_picture: string | null } | null;
        
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.author_id,
          tier_id: post.tier_id,
          createdAt: post.created_at,
          attachments: post.attachments || [],
          is_nsfw: post.is_nsfw || false,
          authorName: userData?.username || creator.display_name || "Creator",
          authorAvatar: userData?.profile_picture || creator.profile_image_url || null,
          date: formatRelativeDate(post.created_at),
          tags: post.title
            ?.split(' ')
            .filter(word => word.length > 3)
            .slice(0, 3)
            .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, '')) || []
        };
      });
    },
    enabled: !!creator?.id
  });

  return {
    creator,
    posts: posts || [],
    isLoadingCreator,
    isLoadingPosts,
    creatorError,
    refetchCreator,
    refetchPosts
  };
}
