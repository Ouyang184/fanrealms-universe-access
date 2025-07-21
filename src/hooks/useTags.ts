import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePopularTags(limit: number = 50) {
  return useQuery({
    queryKey: ['popular-tags', limit],
    queryFn: async () => {
      // Get all posts with tags and count tag frequency
      const { data: posts, error } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null)
        .eq('status', 'published');

      if (error) throw error;

      // Count tag frequency
      const tagCounts: { [key: string]: number } = {};
      
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            const normalizedTag = tag.toLowerCase().trim();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          });
        }
      });

      // Sort by frequency and return top tags
      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTagSuggestions(query: string = '') {
  return useQuery({
    queryKey: ['tag-suggestions', query],
    queryFn: async () => {
      if (!query.trim()) return [];

      // Get all unique tags that match the query
      const { data: posts, error } = await supabase
        .from('posts')
        .select('tags')
        .not('tags', 'is', null)
        .eq('status', 'published');

      if (error) throw error;

      const allTags = new Set<string>();
      
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            const normalizedTag = tag.toLowerCase().trim();
            if (normalizedTag.includes(query.toLowerCase().trim())) {
              allTags.add(normalizedTag);
            }
          });
        }
      });

      return Array.from(allTags).slice(0, 10);
    },
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePostsByTag(tag: string, limit: number = 20) {
  return useQuery({
    queryKey: ['posts-by-tag', tag, limit],
    queryFn: async () => {
      if (!tag) throw new Error('Tag is required');

      // Use array contains operator to find posts with the specific tag
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey(username, profile_picture),
          creators!posts_creator_id_fkey(display_name, profile_image_url)
        `)
        .contains('tags', [tag])
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return posts?.map(post => ({
        ...post,
        authorName: post.creators?.display_name || post.users?.username || 'Unknown',
        authorAvatar: post.creators?.profile_image_url || post.users?.profile_picture
      })) || [];
    },
    enabled: !!tag,
  });
}