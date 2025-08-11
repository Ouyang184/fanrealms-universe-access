
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CreatorProfile } from '@/types';

export const useFollows = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follows', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase.rpc('get_user_following', {
        p_user_id: user.id,
        p_limit: 100,
        p_offset: 0,
      });

      if (error) {
        console.error('Error fetching follows:', error);
        throw error;
      }

      // Transform the data to match our CreatorProfile type
      const followedCreators: CreatorProfile[] = (data || []).map((row: any) => ({
        id: row.creator_id,
        user_id: row.creator_user_id,
        username: row.username || `user-${String(row.creator_user_id).substring(0, 8)}`,
        email: "",
        fullName: row.username || "",
        display_name: row.display_name || row.username || `Creator ${String(row.creator_id).substring(0, 6)}`,
        displayName: row.display_name || row.username || `Creator ${String(row.creator_id).substring(0, 6)}`,
        bio: row.bio || "",
        avatar_url: row.profile_image_url || null,
        profile_image_url: row.profile_image_url || null,
        banner_url: row.banner_url || null,
        follower_count: row.follower_count || 0,
        tags: row.tags || [],
        created_at: row.followed_at,
      }));

      return followedCreators;
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds instead of longer
    refetchInterval: 60000, // Refetch every minute to get updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};
