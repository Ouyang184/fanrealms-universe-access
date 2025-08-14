
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
      
      
      // Determine sort parameter for RPC
      const sortBy = filters?.sortBy || 'created_at';
      const rpcSort = sortBy === 'followers' || sortBy === 'engagement' ? 'followers' : 'created_at';
      
      // Validate search term length
      if (searchTerm && searchTerm.trim().length < 2) {
        
        return [];
      }
      const term = searchTerm?.toLowerCase().trim() || null;
      
      const { data, error } = await supabase.rpc('get_public_creators_list', {
        p_search: term,
        p_sort: rpcSort,
        p_limit: 50,
        p_offset: 0,
      });
      
      if (error) {
        
        throw error;
      }
      
      const list = Array.isArray(data) ? data : [];
      
      // Transform the data to match our CreatorProfile type
      let transformedCreators: CreatorProfile[] = list.map((creator) => {
        const userId = creator.user_id as string | null;
        const cleanUserId = userId?.startsWith('user-') ? userId.substring(5) : userId || undefined;
        const displayName = creator.display_name || creator.username || `Creator ${(cleanUserId || '').substring(0, 6)}`;
        
        return {
          id: creator.id,
          user_id: cleanUserId as string,
          username: creator.username || `user-${(cleanUserId || '').substring(0, 8)}`,
          email: "",
          fullName: displayName,
          display_name: displayName,
          displayName: displayName,
          avatar_url: creator.profile_image_url || null,
          profile_image_url: creator.profile_image_url || null,
          banner_url: creator.banner_url || null,
          created_at: creator.created_at || new Date().toISOString(),
          bio: creator.bio || "",
          tags: creator.tags || [],
          followers_count: creator.follower_count || 0,
          follower_count: creator.follower_count || 0,
          is_nsfw: creator.is_nsfw || false,
        } as CreatorProfile;
      });
      
      // Apply follower size filters in application layer
      if (filters?.followerSize && filters.followerSize.length > 0) {
        transformedCreators = transformedCreators.filter(c => {
          const fc = c.follower_count || 0;
          return filters.followerSize!.some(size => {
            switch (size) {
              case 'micro': return fc >= 1000 && fc < 10000;
              case 'mid': return fc >= 10000 && fc < 100000;
              case 'macro': return fc >= 100000 && fc < 1000000;
              case 'mega': return fc >= 1000000;
              default: return true;
            }
          });
        });
      }
      
      // Apply content type filters in application layer (bio and tags)
      if (filters?.contentType && filters.contentType.length > 0) {
        const contentTypes = new Set(filters.contentType.map(t => t.toLowerCase()));
        transformedCreators = transformedCreators.filter(c => {
          const inBio = (c.bio || '').toLowerCase();
          const inTags = (c.tags || []).map(t => String(t).toLowerCase());
          return Array.from(contentTypes).some(t => inBio.includes(t) || inTags.includes(t));
        });
      }
      
      // Sorting already handled by RPC; keep order or apply final sort if needed
      if (sortBy === 'followers' || sortBy === 'engagement') {
        transformedCreators = [...transformedCreators].sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
      } else if (sortBy === 'recent') {
        transformedCreators = [...transformedCreators].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }
      
      
      return transformedCreators;
    },
    staleTime: 30000, // Cache for 30 seconds
    enabled: !searchTerm || searchTerm.trim().length >= 2, // Only run query if search term is empty or has 2+ characters
    retry: 1 // Reduce retries for faster error feedback
  });
};
