
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export const usePostViews = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get view count for a post
  const { data: viewCount = 0 } = useQuery({
    queryKey: ["post-views", postId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_post_view_count', {
        post_id_param: postId
      });
      
      if (error) {
        console.error('Error fetching view count:', error);
        return 0;
      }
      
      return data || 0;
    }
  });

  // Check if current user has viewed this post
  const { data: hasViewed = false } = useQuery({
    queryKey: ["post-view-status", postId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('post_views')
        .select('id')
        .eq('post_id', postId as any)
        .eq('user_id', user.id as any)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking view status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id
  });

  // Record a view
  const recordViewMutation = useMutation({
    mutationFn: async ({ viewType = 'read' }: { viewType?: 'preview' | 'read' }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('post_views')
        .upsert({
          post_id: postId,
          user_id: user.id,
          view_type: viewType,
          viewed_at: new Date().toISOString()
        } as any, {
          onConflict: 'post_id,user_id'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch view count and status
      queryClient.invalidateQueries({ queryKey: ["post-views", postId] });
      queryClient.invalidateQueries({ queryKey: ["post-view-status", postId, user?.id] });
    }
  });

  return {
    viewCount,
    hasViewed,
    recordView: recordViewMutation.mutate,
    isRecording: recordViewMutation.isPending
  };
};

// Hook to record a view when a post becomes "read" (leaves unread section)
export const usePostViewTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recordView = async (postId: string, viewType: 'preview' | 'read' = 'read') => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('post_views')
        .upsert({
          post_id: postId,
          user_id: user.id,
          view_type: viewType,
          viewed_at: new Date().toISOString()
        } as any, {
          onConflict: 'post_id,user_id'
        });

      if (error) {
        console.error('Error recording post view:', error);
        return;
      }

      // Invalidate view count queries for this post
      queryClient.invalidateQueries({ queryKey: ["post-views", postId] });
      
      console.log(`Post view recorded: ${postId} (${viewType})`);
    } catch (error) {
      console.error('Error recording post view:', error);
    }
  };

  return { recordView };
};
