
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function usePostLikes(postId: string) {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        // Get total likes count
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('*')
          .eq('post_id', postId as any);

        if (likesError) {
          console.error('Error fetching likes:', likesError);
          return;
        }

        setLikes(likesData?.length || 0);

        // Check if current user has liked this post
        if (user?.id) {
          const userLike = likesData?.find(like => like.user_id === user.id);
          setIsLiked(!!userLike);
        }
      } catch (error) {
        console.error('Error in fetchLikes:', error);
      }
    };

    fetchLikes();
  }, [postId, user?.id]);

  const handleLike = async () => {
    if (!user?.id) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to like posts.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId as any)
          .eq('user_id', user.id as any);

        if (error) throw error;

        setLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: user.id,
          } as any);

        if (error) throw error;

        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    likes,
    isLiked,
    handleLike,
  };
}
