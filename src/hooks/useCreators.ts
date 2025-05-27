
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile } from "@/types";

export const useCreators = (searchTerm?: string) => {
  return useQuery({
    queryKey: ["creators", searchTerm],
    queryFn: async () => {
      console.log("Searching creators with term:", searchTerm);
      
      let query = supabase
        .from('creators')
        .select(`
          *,
          users!creators_user_id_fkey (
            id,
            username,
            email,
            profile_picture
          )
        `)
        .order('created_at', { ascending: false });

      // If search term is provided, filter by username or display_name
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        // Use separate filters and combine with or()
        query = query.or(`display_name.ilike.%${term}%,users.username.ilike.%${term}%`);
      }
      
      const { data: creatorData, error } = await query;

      if (error) {
        console.error('Error fetching creators:', error);
        throw error;
      }

      console.log('Raw creator data from search:', creatorData);

      // Transform the data to match our CreatorProfile type
      const transformedCreators: CreatorProfile[] = creatorData.map((creator) => {
        const userId = creator.user_id;
        
        // Ensure we don't generate invalid UUIDs in the app by removing any "user-" prefix
        const cleanUserId = userId?.startsWith('user-') 
          ? userId.substring(5) 
          : userId;
        
        // Create a display name that is used in both display_name and displayName fields
        const displayName = creator.display_name || creator.users?.username || `Creator ${cleanUserId.substring(0, 6)}`;
        
        return {
          ...creator,
          user_id: cleanUserId, // Use clean ID without prefix 
          id: cleanUserId,
          username: creator.users?.username || `user-${cleanUserId.substring(0, 8)}`,
          email: creator.users?.email || "",
          fullName: creator.users?.username || "", // Add required fullName property
          avatar_url: creator.users?.profile_picture || null,
          profile_image_url: creator.profile_image_url || creator.users?.profile_picture || null,
          display_name: displayName,
          displayName: displayName, // Make sure both properties have the same value
          banner_url: creator.banner_url || null,
          created_at: creator.created_at || new Date().toISOString(),
          bio: creator.bio || "",
          tags: creator.tags || [],
          followers_count: creator.follower_count || 0 // Add follower count from database
        };
      });

      console.log('Transformed creators for search:', transformedCreators);
      return transformedCreators;
    },
    staleTime: 10000 // Reduced cache time for more frequent updates
  });
};
