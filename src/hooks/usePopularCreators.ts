
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile, Tier } from "@/types";

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
            description,
            created_at
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
        banner_url: creator.banner_url || null, // Ensure banner_url is always defined
        tiers: creator.membership_tiers?.map((tier): Tier => ({
          ...tier,
          name: tier.title, // Map title to name
          features: tier.description.split(',').map(item => item.trim()), // Convert description to features array
          popular: false // Default value for popular
        }))
      }));
    }
  });
};
