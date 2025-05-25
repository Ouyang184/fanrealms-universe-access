
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  users: {
    username: string;
    profile_picture?: string;
  } | null;
}

export const useComments = (postId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      console.log('Fetching comments for post:', postId);
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          users (
            username,
            profile_picture
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }
      
      console.log('Fetched comments:', data);
      return data as Comment[];
    },
    enabled: !!postId
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error('Must be logged in to comment');

      console.log('Adding comment:', { postId, userId: user.id, content });

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content
        })
        .select(`
          *,
          users (
            username,
            profile_picture
          )
        `)
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }
      
      console.log('Added comment:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast({
        description: "Comment added successfully",
      });
    },
    onError: (error) => {
      console.error('Comment mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id) throw new Error('Must be logged in to delete comment');

      console.log('Deleting comment:', commentId);

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      toast({
        description: "Comment deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Delete comment error:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    comments,
    isLoading,
    error,
    addComment: addCommentMutation.mutate,
    deleteComment: deleteCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};
