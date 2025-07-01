
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async (): Promise<Post[]> => {
      console.log('[usePosts] Fetching posts with scheduling filter');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            id,
            username,
            profile_picture
          ),
          creators!posts_creator_id_fkey (
            id,
            display_name,
            profile_image_url
          ),
          membership_tiers (
            id,
            title,
            price
          ),
          post_tiers (
            tier_id,
            membership_tiers (
              id,
              title,
              price
            )
          ),
          likes(count),
          comments(count)
        `)
        .or(`status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${new Date().toISOString()})`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }

      console.log('[usePosts] Raw posts data:', data);

      return data.map((post): Post => {
        // Safely handle user data with proper typing
        const userData = post.users as { id: string; username: string; profile_picture: string | null } | null;
        const creatorData = post.creators as { id: string; display_name: string; profile_image_url: string | null } | null;
        
        // Handle tier information
        const tierInfo = post.membership_tiers || null;
        const postTiers = post.post_tiers || [];
        
        // Determine if this is a premium post
        const isPremium = !!(post.tier_id || postTiers.length > 0);
        
        // Calculate engagement metrics
        const likeCount = Array.isArray(post.likes) ? post.likes.length : 0;
        const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.author_id, // Use authorId to match Post interface
          tier_id: post.tier_id,
          createdAt: post.created_at, // Use createdAt to match Post interface
          attachments: post.attachments || [],
          is_nsfw: post.is_nsfw || false,
          
          // Set authorName and authorAvatar from the fetched user data
          authorName: userData?.username || creatorData?.display_name || "Creator",
          authorAvatar: userData?.profile_picture || creatorData?.profile_image_url || null,
          
          // Add tags if they exist in the database (may need to be added to Post interface)
          tags: post.title
            ?.split(' ')
            .filter(word => word.length > 3)
            .slice(0, 3)
            .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, '')) || []
        };
      });
    },
    staleTime: 30000, // 30 seconds
  });
}
