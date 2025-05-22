
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile } from "@/types";

export const useCreators = () => {
  return useQuery({
    queryKey: ["creators"],
    queryFn: async () => {
      const { data: creatorData, error } = await supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            username,
            email,
            profile_picture
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match our CreatorProfile type
      const transformedCreators: CreatorProfile[] = creatorData
        .map((creator) => ({
          ...creator,
          username: creator.users?.username,
          email: creator.users?.email,
          avatar_url: creator.users?.profile_picture,
          display_name: creator.display_name || creator.users?.username,
          banner_url: creator.banner_url || null, // Ensure banner_url is always defined
        }));

      return transformedCreators;
    }
  });
};
