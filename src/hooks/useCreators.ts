
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile } from "@/types";

export const useCreators = () => {
  return useQuery({
    queryKey: ["creators", "popular"],
    queryFn: async () => {
      // Get creators with their post counts
      const { data: creatorData, error } = await supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            username,
            email,
            profile_picture
          ),
          posts!posts_author_id_fkey (
            id
          )
        `)
        .limit(10);

      if (error) {
        throw error;
      }

      // Transform and sort by post count
      const transformedCreators: CreatorProfile[] = creatorData
        .map((creator) => ({
          ...creator,
          username: creator.users?.username,
          email: creator.users?.email,
          avatar_url: creator.users?.profile_picture,
          postCount: creator.posts?.length || 0
        }))
        .sort((a, b) => (b.postCount || 0) - (a.postCount || 0));

      return transformedCreators;
    }
  });
};
