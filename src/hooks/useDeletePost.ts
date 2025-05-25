
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useDeletePost = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Must be logged in to delete posts');

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user.id); // Extra safety check

      if (error) throw error;
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
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    deletePost: deletePostMutation.mutate,
    isDeleting: deletePostMutation.isPending,
  };
};
