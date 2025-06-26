
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useLikes = (postId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: likesData } = useQuery({
    queryKey: ['likes', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('likes')
        .select('id, user_id')
        .eq('post_id', postId);

      if (error) throw error;
      
      return {
        count: data.length,
        isLiked: user ? data.some(like => like.user_id === user.id) : false,
        userLikeId: user ? data.find(like => like.user_id === user.id)?.id : null
      };
    },
    enabled: !!postId
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Must be logged in to like');

      if (likesData?.isLiked && likesData?.userLikeId) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', likesData.userLikeId);

        if (error) throw error;
        return 'unliked';
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (error) throw error;
        return 'liked';
      }
    },
    onSuccess: (action) => {
      queryClient.invalidateQueries({ queryKey: ['likes', postId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    likeCount: likesData?.count || 0,
    isLiked: likesData?.isLiked || false,
    toggleLike: toggleLikeMutation.mutate,
    isToggling: toggleLikeMutation.isPending,
  };
};
