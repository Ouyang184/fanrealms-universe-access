
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
      
      const { data, error } = await supabase
        .from('follows')
        .select(`
          creator_id,
          created_at,
          creators (
            id,
            user_id,
            display_name,
            bio,
            profile_image_url,
            banner_url,
            follower_count,
            tags,
            users (
              id,
              username,
              email,
              profile_picture
            )
          )
        `)
        .eq('user_id', user.id as any);

      if (error) {
        console.error('Error fetching follows:', error);
        throw error;
      }

      // Transform the data to match our CreatorProfile type
      const followedCreators: CreatorProfile[] = (data as any)
        .filter((follow: any) => follow.creators) // Filter out any null creators
        .map((follow: any) => {
          const creator = follow.creators;
          const user = creator.users;
          
          return {
            id: creator.id,
            user_id: creator.user_id,
            username: user?.username || `user-${creator.user_id?.substring(0, 8)}`,
            email: user?.email || "",
            fullName: user?.username || "",
            display_name: creator.display_name || user?.username || `Creator ${creator.id.substring(0, 6)}`,
            displayName: creator.display_name || user?.username || `Creator ${creator.id.substring(0, 6)}`,
            bio: creator.bio || "",
            // Prioritize creator's profile_image_url over user's profile_picture
            avatar_url: creator.profile_image_url || user?.profile_picture || null,
            profile_image_url: creator.profile_image_url || user?.profile_picture || null,
            banner_url: creator.banner_url || null,
            follower_count: creator.follower_count || 0,
            tags: creator.tags || [],
            created_at: (follow as any).created_at
          };
        });

      return followedCreators;
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds instead of longer
    refetchInterval: 60000, // Refetch every minute to get updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};
