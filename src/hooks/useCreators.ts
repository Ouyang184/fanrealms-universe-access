
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CreatorProfile } from "@/types";

interface SearchFilters {
  followerSize?: string[];
  engagementRate?: string[];
  contentType?: string[];
  platform?: string[];
  sortBy?: string;
}

export const useCreators = (searchTerm?: string, filters?: SearchFilters) => {
  return useQuery({
    queryKey: ["creators", searchTerm, filters],
    queryFn: async () => {
      console.log("useCreators - Searching creators with term:", searchTerm, "and filters:", filters);
      
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
        `);

      // Apply search term filter with proper PostgREST syntax
      if (searchTerm && searchTerm.trim().length >= 2) {
        const term = searchTerm.toLowerCase().trim();
        console.log("useCreators - Applying search filter for:", term);
        
        // Use separate filters and combine them with OR logic
        // First search in creators table fields
        query = query.or(`display_name.ilike.%${term}%,bio.ilike.%${term}%`);
        
        // For username search, we need to handle it differently since it's in a joined table
        // We'll filter this in the application layer after getting results
      } else if (searchTerm && searchTerm.trim().length < 2) {
        // Return empty array for searches less than 2 characters
        console.log("useCreators - Search term too short, returning empty array");
        return [];
      }

      // Apply follower size filters
      if (filters?.followerSize && filters.followerSize.length > 0) {
        const followerConditions = filters.followerSize.map(size => {
          switch (size) {
            case 'micro': return 'follower_count.gte.1000,follower_count.lt.10000';
            case 'mid': return 'follower_count.gte.10000,follower_count.lt.100000';
            case 'macro': return 'follower_count.gte.100000,follower_count.lt.1000000';
            case 'mega': return 'follower_count.gte.1000000';
            default: return '';
          }
        }).filter(Boolean);
        
        if (followerConditions.length > 0) {
          query = query.or(followerConditions.join(','));
        }
      }

      // Apply content type filters (search in bio and tags)
      if (filters?.contentType && filters.contentType.length > 0) {
        const contentConditions = filters.contentType.map(type => {
          return `bio.ilike.%${type}%,tags.cs.{${type}}`;
        });
        query = query.or(contentConditions.join(','));
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      switch (sortBy) {
        case 'followers':
          query = query.order('follower_count', { ascending: false });
          break;
        case 'engagement':
          // For now, sort by follower count as engagement metrics aren't fully implemented
          query = query.order('follower_count', { ascending: false });
          break;
        case 'recent':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
      
      const { data: creatorData, error } = await query.limit(50);

      if (error) {
        console.error('useCreators - Error fetching creators:', error);
        throw error;
      }

      console.log('useCreators - Raw creator data from search:', creatorData);

      // Transform the data to match our CreatorProfile type
      let transformedCreators: CreatorProfile[] = (creatorData || []).map((creator) => {
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

      // Filter by username in application layer if search term is provided
      if (searchTerm && searchTerm.trim().length >= 2) {
        const term = searchTerm.toLowerCase().trim();
        transformedCreators = transformedCreators.filter(creator => {
          const matchesDisplay = creator.display_name?.toLowerCase().includes(term);
          const matchesBio = creator.bio?.toLowerCase().includes(term);
          const matchesUsername = creator.username?.toLowerCase().includes(term);
          
          return matchesDisplay || matchesBio || matchesUsername;
        });
      }

      console.log('useCreators - Transformed creators for search:', transformedCreators);
      return transformedCreators;
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled: !searchTerm || searchTerm.trim().length >= 2, // Only run query if search term is empty or has 2+ characters
    retry: 1 // Reduce retries for faster error feedback
  });
};
