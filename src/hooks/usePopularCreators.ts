
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile } from "@/types";

export const usePopularCreators = () => {
  return useQuery({
    queryKey: ["creators", "popular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            username,
            profile_picture
          ),
          membership_tiers (
            id,
            title,
            price,
            description
          )
        `)
        .limit(3);

      if (error) {
        throw error;
      }

      return data.map((creator): CreatorProfile => ({
        ...creator,
        username: creator.users?.username,
        avatar_url: creator.users?.profile_picture,
        tiers: creator.membership_tiers
      }));
    }
  });
};
