
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";

export const usePosts = () => {
  return useQuery({
    queryKey: ["posts", "recent"],
    queryFn: async () => {
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

      if (error) {
        throw error;
      }

      return posts.map((post): Post => ({
        ...post,
        authorName: post.users?.username || 'Unknown',
        authorAvatar: post.users?.profile_picture || null,
        date: formatRelativeDate(post.created_at)
      }));
    }
  });
};
