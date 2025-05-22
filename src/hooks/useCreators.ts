
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
        const term = `%${searchTerm.toLowerCase().trim()}%`;
        query = query
          .or(`display_name.ilike.${term},users.username.ilike.${term}`);
      }
      
      const { data: creatorData, error } = await query;

      if (error) {
        console.error('Error fetching creators:', error);
        throw error;
      }

      console.log('Raw creator data from search:', creatorData);

      // Transform the data to match our CreatorProfile type
      // Include all creators, even if they don't have an associated user
      const transformedCreators: CreatorProfile[] = creatorData.map((creator) => ({
        ...creator,
        id: creator.user_id, // Use user_id as the primary id
        username: creator.users?.username || `user-${creator.user_id.substring(0, 8)}`, // Fallback username if not found
        email: creator.users?.email || "",
        avatar_url: creator.users?.profile_picture || null,
        display_name: creator.display_name || creator.users?.username || `Creator ${creator.id.substring(0, 6)}`,
        banner_url: creator.banner_url || null,
      }));

      console.log('Transformed creators for search:', transformedCreators);
      return transformedCreators;
    },
    staleTime: 10000 // Reduced cache time for more frequent updates
  });
};
