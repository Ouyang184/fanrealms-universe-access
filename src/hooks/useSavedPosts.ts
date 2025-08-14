import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useSavedPosts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all saved posts for the current user
  const { data: savedPostsData = [], isLoading } = useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get the saved post IDs
      const { data: savedData, error: savedError } = await supabase
        .from('saved_posts')
        .select('post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (savedError) {
        console.error('Error fetching saved posts:', savedError);
        throw savedError;
      }

      if (!savedData || savedData.length === 0) return [];

      // Then get the full post data
      const postIds = savedData.map(s => s.post_id);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          author_id,
          tier_id,
          attachments,
          tags,
          is_nsfw,
          creator_id
        `)
        .in('id', postIds);

      if (postsError) {
        console.error('Error fetching posts data:', postsError);
        throw postsError;
      }

      // Get creator info
      const creatorIds = postsData?.map(p => p.creator_id).filter(Boolean) || [];
      let creatorsData = [];
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('creators')
          .select('id, display_name, profile_image_url')
          .in('id', creatorIds);
        creatorsData = creators || [];
      }

      // Get user info for posts without creators
      const authorIds = postsData?.map(p => p.author_id) || [];
      let usersData = [];
      if (authorIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, username, profile_picture')
          .in('id', authorIds);
        usersData = users || [];
      }

      // Combine the data
      const combinedData = savedData.map(saved => {
        const post = postsData?.find(p => p.id === saved.post_id);
        if (!post) return null;

        const creator = creatorsData.find(c => c.id === post.creator_id);
        const user = usersData.find(u => u.id === post.author_id);

        return {
          id: saved.post_id,
          post_id: saved.post_id,
          created_at: saved.created_at,
          posts: {
            ...post,
            creators: creator,
            users: user
          }
        };
      }).filter(Boolean);

      return combinedData;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Get saved post IDs for quick lookup
  const savedPostIds = new Set(savedPostsData.map(saved => saved.post_id));

  // Save a post
  const savePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_posts')
        .insert({
          user_id: user.id,
          post_id: postId
        });

      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts', user?.id] });
      toast({
        title: "Post saved",
        description: "Post has been added to your saved posts",
      });
    },
    onError: (error) => {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Unsave a post
  const unsavePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts', user?.id] });
      toast({
        title: "Post unsaved",
        description: "Post has been removed from your saved posts",
      });
    },
    onError: (error) => {
      console.error('Error unsaving post:', error);
      toast({
        title: "Error",
        description: "Failed to unsave post. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleSave = (postId: string) => {
    if (savedPostIds.has(postId)) {
      unsavePostMutation.mutate(postId);
    } else {
      savePostMutation.mutate(postId);
    }
  };

  return {
    savedPosts: savedPostsData,
    savedPostIds,
    isLoading,
    toggleSave,
    isSaving: savePostMutation.isPending || unsavePostMutation.isPending
  };
};