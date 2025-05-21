
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
            profile_picture,
            email
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
        id: creator.id,
        user_id: creator.user_id,
        username: creator.users?.username || '',
        email: creator.users?.email || '',
        bio: creator.bio,
        website: creator.website,
        display_name: creator.display_name,
        displayName: creator.display_name,
        avatar_url: creator.users?.profile_picture,
        profile_image_url: creator.profile_image_url,
        banner_url: creator.banner_url || null,
        tiers: creator.membership_tiers?.map((tier): Tier => ({
          id: tier.id,
          creator_id: creator.id,
          name: tier.title,
          price: tier.price,
          description: tier.description,
          features: tier.description.split(',').map(item => item.trim()),
          subscriberCount: 0 // Default value for subscriber count
        }))
      }));
    }
  });
};
