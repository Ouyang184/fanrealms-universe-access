
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";

export const usePostsByCategories = (categoryIds: number[] = []) => {
  return useQuery({
    queryKey: ["posts", "by-categories", categoryIds],
    queryFn: async () => {
      // If no categories selected, get all posts
      if (categoryIds.length === 0) {
        return await getAllPosts();
      }

      // Get creators who have tags that match the user's preferred categories
      const categoryNames = getCategoryNames(categoryIds);
      
      // Query posts from creators whose tags include any of the user's preferred categories
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            username,
            profile_picture
          ),
          creators!posts_creator_id_fkey (
            tags
          )
        `)
        .not('creator_id', 'is', null) // Only get posts that have a creator_id
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts by categories:', error);
        throw error;
      }

      // Filter posts where creator tags overlap with user preferences
      const filteredPosts = posts?.filter(post => {
        if (!post.creators?.tags || !Array.isArray(post.creators.tags)) {
          return false;
        }
        
        // Check if any of the creator's tags match any of the user's preferred categories
        return categoryNames.some(categoryName => 
          post.creators.tags.some((tag: string) => 
            tag.toLowerCase().includes(categoryName.toLowerCase()) ||
            categoryName.toLowerCase().includes(tag.toLowerCase())
          )
        );
      }) || [];

      // If no posts match the user's preferences, fallback to all posts
      if (filteredPosts.length === 0) {
        console.log('No posts found matching user preferences, showing all posts');
        return await getAllPosts();
      }

      return filteredPosts.map((post): Post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        authorName: post.users?.username || 'Unknown',
        authorAvatar: post.users?.profile_picture || null,
        createdAt: post.created_at,
        date: formatRelativeDate(post.created_at),
        tier_id: post.tier_id,
        attachments: post.attachments
      }));
    },
    enabled: true // Always enabled now since we have fallback
  });
};

const getAllPosts = async (): Promise<Post[]> => {
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_author_id_fkey (
        username,
        profile_picture
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching all posts:', error);
    throw error;
  }

  return (posts || []).map((post): Post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    authorId: post.author_id,
    authorName: post.users?.username || 'Unknown',
    authorAvatar: post.users?.profile_picture || null,
    createdAt: post.created_at,
    date: formatRelativeDate(post.created_at),
    tier_id: post.tier_id,
    attachments: post.attachments
  }));
};

const getCategoryNames = (categoryIds: number[]) => {
  const categories = [
    { id: 1, name: "Art & Illustration" },
    { id: 2, name: "Gaming" },
    { id: 3, name: "Music" },
    { id: 4, name: "Writing" },
    { id: 5, name: "Photography" },
    { id: 6, name: "Education" },
    { id: 7, name: "Podcasts" },
    { id: 8, name: "Cooking" },
    { id: 9, name: "Fitness" },
    { id: 10, name: "Technology" },
    { id: 11, name: "Fashion" },
    { id: 12, name: "Film & Video" },
  ];
  
  return categoryIds
    .map(id => categories.find(cat => cat.id === id)?.name)
    .filter(Boolean) as string[];
};
