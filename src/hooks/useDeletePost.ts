
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useDeletePost = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      console.log('Attempting to delete post:', postId, 'User:', user?.id);
      
      if (!user?.id) {
        console.error('No user found');
        throw new Error('Must be logged in to delete posts');
      }

      // First check if the post exists and belongs to the user
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('id, author_id')
        .eq('id', postId)
        .single();

      if (fetchError) {
        console.error('Error fetching post:', fetchError);
        throw new Error('Post not found');
      }

      if (post.author_id !== user.id) {
        console.error('User does not own this post');
        throw new Error('You can only delete your own posts');
      }

      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id);

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }

      console.log('Post deleted successfully');
    },
    onSuccess: () => {
      // Invalidate all post-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
      queryClient.invalidateQueries({ queryKey: ['creatorPosts'] });
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    deletePost: deletePostMutation.mutate,
    isDeleting: deletePostMutation.isPending,
  };
};
