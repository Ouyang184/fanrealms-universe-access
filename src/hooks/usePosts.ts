
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";

export const usePosts = () => {
  return useQuery({
    queryKey: ["posts", "recent"],
    queryFn: async () => {
      console.log('[usePosts] Fetching ALL posts, including tier-restricted ones');
      
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

      // Log tier distribution
      const tierStats = posts.reduce((acc, post) => {
        const tierType = post.tier_id ? 'premium' : 'public';
        acc[tierType] = (acc[tierType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('[usePosts] Post tier distribution:', tierStats);
      console.log('[usePosts] Sample posts with author IDs:', posts.slice(0, 3).map(p => ({ 
        id: p.id, 
        title: p.title, 
        tier_id: p.tier_id,
        author_id: p.author_id // Log raw author_id
      })));

      return posts.map((post): Post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id, // CRITICAL FIX: Map database field to frontend field
        authorName: post.users?.username || 'Unknown',
        authorAvatar: post.users?.profile_picture || null,
        createdAt: post.created_at,
        date: formatRelativeDate(post.created_at),
        tier_id: post.tier_id,
        attachments: post.attachments
      }));
    }
  });
};
