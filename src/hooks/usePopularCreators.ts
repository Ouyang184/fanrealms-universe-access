
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile, Tier } from "@/types";

export const usePopularCreators = (excludeAI = true) => {
  return useQuery({
    queryKey: ["creators", "popular", { excludeAI }],
    queryFn: async () => {
      console.log("Fetching popular creators, excludeAI:", excludeAI);

      // Fetch popular creators via secure RPC (sorted by followers)
      const { data, error } = await supabase.rpc('get_public_creators_list', {
        p_search: excludeAI ? null : null,
        p_sort: 'followers',
        p_limit: 20,
        p_offset: 0,
      });

      if (error) {
        console.error("Error fetching popular creators via RPC:", error);
        throw error;
      }

      const allCreators = (Array.isArray(data) ? data : []) as any[];

      // Additional filter to remove any hardcoded placeholders that might have made it through
      const filtered = allCreators.filter(creator => {
        const name = creator.display_name || '';
        const placeholderNames = [
          'Digital Art Master', 
          'Music Production Studio', 
          'Game Development Pro',
          'Writing Workshop',
          'Photography Pro',
          'Education Insights'
        ];
        return !placeholderNames.some(placeholder => name.includes(placeholder));
      }).slice(0, 10);

      // Fetch active membership tiers for these creators
      const creatorIds = filtered.map(c => c.id);
      let tiersByCreator: Record<string, any[]> = {};
      if (creatorIds.length > 0) {
        const results = await Promise.all(
          creatorIds.map(async (id) => {
            const { data, error } = await supabase.rpc('get_public_membership_tiers', { p_creator_id: id });
            if (error) {
              console.warn('Error fetching public tiers for creator', id, error);
              return [] as any[];
            }
            return data || [];
          })
        );
        const tiersData = results.flat();
        tiersByCreator = tiersData.reduce((acc: Record<string, any[]>, tier: any) => {
          acc[tier.creator_id] = acc[tier.creator_id] || [];
          acc[tier.creator_id].push(tier);
          return acc;
        }, {} as Record<string, any[]>);
      }

      return filtered.map((creator): CreatorProfile => {
        const displayName = creator.display_name || creator.username || '';
        const creatorTiers = tiersByCreator[creator.id] || [];
        
        return {
          id: creator.id,
          user_id: creator.user_id,
          username: creator.username || '',
          fullName: displayName,
          bio: creator.bio || '',
          display_name: displayName,
          displayName: displayName,
          avatar_url: creator.profile_image_url || '',
          profile_image_url: creator.profile_image_url || '',
          banner_url: creator.banner_url || '',
          created_at: creator.created_at,
          tags: creator.tags || [],
          is_nsfw: creator.is_nsfw || false,
          tiers: creatorTiers.map((tier): Tier => ({
            id: tier.id,
            creator_id: creator.id,
            name: tier.title,
            price: tier.price,
            description: tier.description,
            features: tier.description?.split(',').map((item: string) => item.trim()) || [],
            subscriberCount: 0
          }))
        } as CreatorProfile;
      });
    }
  });
};
