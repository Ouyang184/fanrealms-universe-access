
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
        .eq('is_ai', false) // Only fetch non-AI creators
        .limit(3);

      if (error) {
        throw error;
      }

      return data.map((creator): CreatorProfile => {
        const displayName = creator.display_name || creator.users?.username || '';
        
        return {
          id: creator.id,
          user_id: creator.user_id,
          username: creator.users?.username || '',
          email: creator.users?.email || '',
          fullName: creator.users?.username || '',
          bio: creator.bio || '',
          display_name: displayName,
          displayName: displayName,
          avatar_url: creator.users?.profile_picture || '',
          profile_image_url: creator.profile_image_url || creator.users?.profile_picture || '',
          banner_url: creator.banner_url || '',
          created_at: creator.created_at,
          tags: creator.tags || [],
          tiers: creator.membership_tiers?.map((tier): Tier => ({
            id: tier.id,
            creator_id: creator.id,
            name: tier.title,
            price: tier.price,
            description: tier.description,
            features: tier.description.split(',').map(item => item.trim()),
            subscriberCount: 0 // Default value for subscriber count
          }))
        };
      });
    }
  });
};
