
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile } from "@/types";

export const useCreators = (searchTerm?: string) => {
  return useQuery({
    queryKey: ["creators", searchTerm],
    queryFn: async () => {
      let query = supabase
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

      // If search term is provided, filter by username or display_name
      if (searchTerm && searchTerm.trim() !== '') {
        const term = `%${searchTerm.toLowerCase()}%`;
        query = query
          .or(`display_name.ilike.${term},users.username.ilike.${term}`);
      }
      
      const { data: creatorData, error } = await query;

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
