
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // First, check if the user owns the post
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('id, author_id')
        .eq('id', postId as any)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if ((post as any)?.author_id !== user.id) {
        throw new Error('You can only delete your own posts');
      }

      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId as any)
        .eq('author_id', user.id as any);

      if (error) {
        throw error;
      }

      return postId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['creatorPosts'] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfilePosts'] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  });
};
