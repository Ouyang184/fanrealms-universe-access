
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile } from "@/types";

export const useCreators = (searchTerm?: string) => {
  return useQuery({
    queryKey: ["creators", searchTerm],
    queryFn: async () => {
      console.log("useCreators - Searching creators with term:", searchTerm);
      
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

      // If search term is provided and has minimum length, filter results
      if (searchTerm && searchTerm.trim().length >= 2) {
        const term = searchTerm.toLowerCase().trim();
        console.log("useCreators - Applying search filter for:", term);
        
        // Use proper PostgREST syntax for OR conditions with ilike
        query = query.or(`display_name.ilike.%${term}%,bio.ilike.%${term}%,users.username.ilike.%${term}%`);
      } else if (searchTerm && searchTerm.trim().length < 2) {
        // Return empty array for searches less than 2 characters
        console.log("useCreators - Search term too short, returning empty array");
        return [];
      }
      
      const { data: creatorData, error } = await query.limit(50); // Increase limit for search results

      if (error) {
        console.error('useCreators - Error fetching creators:', error);
        throw error;
      }

      console.log('useCreators - Raw creator data from search:', creatorData);

      // Transform the data to match our CreatorProfile type
      const transformedCreators: CreatorProfile[] = (creatorData || []).map((creator) => {
        const userId = creator.user_id;
        
        // Ensure we don't generate invalid UUIDs in the app by removing any "user-" prefix
        const cleanUserId = userId?.startsWith('user-') 
          ? userId.substring(5) 
          : userId;
        
        // Create a display name that prioritizes display_name, then username
        const displayName = creator.display_name || creator.users?.username || `Creator ${cleanUserId?.substring(0, 6) || 'Unknown'}`;
        
        return {
          ...creator,
          user_id: cleanUserId, // Use clean ID without prefix 
          id: creator.id, // Keep the creator ID as is
          username: creator.users?.username || `user-${cleanUserId?.substring(0, 8) || 'unknown'}`,
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
          followers_count: creator.follower_count || 0, // Use follower_count from database
          follower_count: creator.follower_count || 0 // Keep both naming conventions
        };
      });

      console.log('useCreators - Transformed creators for search:', transformedCreators);
      return transformedCreators;
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled: !searchTerm || searchTerm.trim().length >= 2, // Only run query if search term is empty or has 2+ characters
    retry: 1 // Reduce retries for faster error feedback
  });
};
