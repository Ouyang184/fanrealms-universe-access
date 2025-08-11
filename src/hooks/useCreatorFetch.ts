
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Post, CreatorProfile } from "@/types";
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
    queryFn: async (): Promise<CreatorProfile | null> => {
      if (!identifier) return null;
      
      console.log('[useCreatorFetch] Fetching creator with identifier:', identifier);
      
      // Try to fetch by username first, then by creator ID, then by display_name using secure RPCs
      
      // Decode in case identifier came URL-encoded (e.g., display names with spaces)
      const decoded = decodeURIComponent(identifier);
      
      // Check if identifier looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);
      
      let row: any | null = null;
      let rpcError: any | null = null;
      
      try {
        if (isUUID) {
          const { data, error } = await supabase.rpc('get_public_creator_profile', { p_creator_id: decoded });
          rpcError = error;
          row = Array.isArray(data) ? data[0] : data;
        } else {
          // 1) Try username match directly via RPC
          const { data, error } = await supabase.rpc('get_public_creator_profile', { p_username: decoded });
          if (!error && data && (Array.isArray(data) ? data[0] : data)) {
            row = Array.isArray(data) ? data[0] : data;
          } else {
            // 2) Fallback: search by display name using list RPC
            const { data: list } = await supabase.rpc('get_public_creators_list', { p_search: decoded, p_limit: 1, p_offset: 0 });
            row = Array.isArray(list) && list.length > 0 ? list[0] : null;
          }
        }
      } catch (e) {
        rpcError = e;
      }
      
      if (rpcError) {
        console.error('[useCreatorFetch] Error fetching creator via RPC:', rpcError);
        return null;
      }
      
      if (!row) {
        console.warn('[useCreatorFetch] No creator found for identifier:', decoded);
        return null;
      }
      
      console.log('[useCreatorFetch] Creator data (public-safe):', row);
      
      return {
        id: row.id,
        user_id: row.user_id,
        display_name: row.display_name,
        bio: row.bio,
        profile_image_url: row.profile_image_url,
        banner_url: row.banner_url,
        website: row.website,
        tags: row.tags || [],
        follower_count: row.follower_count || 0,
        is_nsfw: row.is_nsfw || false,
        created_at: row.created_at,
        // Sensitive Stripe/commission fields intentionally omitted for public fetch
        username: row.username || null
      } as CreatorProfile;
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
