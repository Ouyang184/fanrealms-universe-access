
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";

export const usePosts = () => {
  return useQuery({
    queryKey: ["posts", "recent"],
    queryFn: async () => {
      // Fetch ALL posts including tier-restricted ones
      const { data: posts, error } = await supabase
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
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      console.log('usePosts - Fetched all posts:', posts?.length || 0, 'including tier-restricted posts');

      return posts.map((post): Post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        authorName: post.users?.username || 'Unknown',
        authorAvatar: post.users?.profile_picture || null,
        createdAt: post.created_at,
        date: formatRelativeDate(post.created_at),
        tier_id: post.tier_id, // Include tier_id for access control
        attachments: post.attachments
      }));
    }
  });
};
