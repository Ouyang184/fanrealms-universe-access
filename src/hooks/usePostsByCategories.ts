
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types';
import { formatRelativeDate } from '@/utils/auth-helpers';

export function usePostsByCategories(categoryIds: number[]) {
  return useQuery({
    queryKey: ['postsByCategories', categoryIds],
    queryFn: async (): Promise<Post[]> => {
      console.log('[usePostsByCategories] Fetching posts for categories:', categoryIds);
      
      const now = new Date().toISOString();
      
      // If no categories are provided, return empty array
      if (!categoryIds || categoryIds.length === 0) {
        console.log('[usePostsByCategories] No categories provided, returning empty array');
        return [];
      }

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
            profile_image_url,
            tags
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
        // Only show published posts OR scheduled posts that have reached their scheduled time
        .or(`and(status.eq.published,scheduled_for.is.null),and(status.eq.scheduled,scheduled_for.lte.${now})`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[usePostsByCategories] Error fetching posts:', error);
        throw error;
      }

      console.log('[usePostsByCategories] Raw posts data:', data);
      console.log('[usePostsByCategories] Current time for scheduling filter:', now);

      // Filter posts by creator tags matching user's preferred categories
      const filteredPosts = data.filter(post => {
        const creatorData = post.creators as { tags: string[] } | null;
        const creatorTags = creatorData?.tags || [];
        
        // Check if any of the creator's tags match the user's preferred categories
        return creatorTags.some(tag => {
          const tagLower = tag.toLowerCase();
          return categoryIds.some(categoryId => {
            // Map category IDs to tag names (this might need adjustment based on your category mapping)
            const categoryNames = {
              1: 'art',
              2: 'gaming',
              3: 'music',
              4: 'writing',
              5: 'photography',
              6: 'education',
              7: 'podcasts',
              8: 'cooking',
              9: 'fitness',
              10: 'technology',
              11: 'fashion',
              12: 'film'
            };
            const categoryName = categoryNames[categoryId as keyof typeof categoryNames];
            return categoryName && tagLower.includes(categoryName.toLowerCase());
          });
        });
      });

      return filteredPosts.map((post): Post => {
        const userData = post.users as { id: string; username: string; profile_picture: string | null } | null;
        const creatorData = post.creators as { id: string; display_name: string; profile_image_url: string | null } | null;
        
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          authorId: post.author_id,
          tier_id: post.tier_id,
          createdAt: post.created_at,
          attachments: post.attachments || [],
          is_nsfw: post.is_nsfw || false,
          authorName: userData?.username || creatorData?.display_name || "Creator",
          authorAvatar: userData?.profile_picture || creatorData?.profile_image_url || null,
          date: formatRelativeDate(post.created_at),
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
