
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useNSFWPreferences } from "@/hooks/useNSFWPreferences";
import { useAuth } from "@/contexts/AuthContext";

export const usePosts = () => {
  const { user } = useAuth();
  const { data: nsfwPrefs } = useNSFWPreferences();
  
  return useQuery({
    queryKey: ["posts", "recent", nsfwPrefs?.isNSFWEnabled],
    queryFn: async () => {
      console.log('[usePosts] Fetching posts with NSFW filter:', nsfwPrefs?.isNSFWEnabled);
      
      // Fetch ALL posts, including tier-restricted ones
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            username,
            profile_picture
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('[usePosts] Raw query result:', { posts, error, count: posts?.length });

      if (error) {
        console.error('[usePosts] Database error:', error);
        throw error;
      }

      if (!posts) {
        console.log('[usePosts] No posts returned from database');
        return [];
      }

      // Filter NSFW content based on user preferences
      let filteredPosts = posts;
      
      if (!nsfwPrefs?.isNSFWEnabled) {
        // Filter out NSFW posts if NSFW is disabled
        filteredPosts = (posts as any).filter((post: any) => {
          // Always show user's own posts regardless of NSFW status
          if (user?.id && post.author_id === user.id) {
            return true;
          }
          // For other posts, filter out NSFW content
          return !post.is_nsfw;
        });
        
        console.log('[usePosts] Filtered out NSFW content:', {
          originalCount: posts.length,
          filteredCount: filteredPosts.length,
          nsfwEnabled: nsfwPrefs?.isNSFWEnabled
        });
      }

      // Log tier distribution
      const tierStats = (filteredPosts as any).reduce((acc: any, post: any) => {
        const tierType = post.tier_id ? 'premium' : 'public';
        acc[tierType] = (acc[tierType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('[usePosts] Post tier distribution:', tierStats);

      return (filteredPosts as any).map((post: any): Post => {
        const mappedPost = {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.author_id,
          authorName: post.users?.username || 'Unknown',
          authorAvatar: post.users?.profile_picture || null,
          createdAt: post.created_at,
          date: formatRelativeDate(post.created_at),
          tier_id: post.tier_id,
          attachments: post.attachments,
          is_nsfw: post.is_nsfw || false
        };
        
        console.log('[usePosts] Mapped post with NSFW filter:', {
          id: mappedPost.id,
          title: mappedPost.title,
          is_nsfw: mappedPost.is_nsfw,
          nsfwEnabled: nsfwPrefs?.isNSFWEnabled
        });
        
        return mappedPost;
      });
    }
  });
};
