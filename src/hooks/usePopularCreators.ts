
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile, Tier } from "@/types";

export const usePopularCreators = (excludeAI = true) => {
  return useQuery({
    queryKey: ["creators", "popular", { excludeAI }],
    queryFn: async () => {
      console.log("Fetching popular creators, excludeAI:", excludeAI);

      let query = supabase
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
        .limit(10); // Fetch more to ensure we have enough after filtering
      
      // If excludeAI is true, add filters to exclude AI creators
      if (excludeAI) {
        query = query
          .not('display_name', 'ilike', '%AI%')
          .not('display_name', 'ilike', '%Digital Art Master%')
          .not('display_name', 'ilike', '%Music Production Studio%')
          .not('display_name', 'ilike', '%Game Development Pro%')
          .not('display_name', 'ilike', '%Writing Workshop%')
          .not('display_name', 'ilike', '%Photography Pro%')
          .not('display_name', 'ilike', '%Education Insights%')
          .not('bio', 'ilike', '%AI generated%');
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching popular creators:", error);
        throw error;
      }

      console.log("Fetched popular creators:", data?.length || 0);

      // Additional filter to remove any hardcoded placeholders that might have made it through
      const filtered = data.filter(creator => {
        // Filter out any creators with placeholder names that might exist in db
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
      });

      return filtered.map((creator): CreatorProfile => {
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
          })) || []
        };
      });
    }
  });
};
