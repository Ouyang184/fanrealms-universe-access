
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export const usePostReads = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get all post reads for the current user
  const { data: postReads = [], isLoading } = useQuery({
    queryKey: ['post-reads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('post_reads')
        .select('post_id, read_at')
        .eq('user_id', user.id as any);

      if (error) {
        console.error('Error fetching post reads:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Convert to Set for faster lookups
  const readPostIds = new Set((postReads as any).map((read: any) => read.post_id));

  // Mark a post as read
  const markAsReadMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('post_reads')
        .upsert({
          user_id: user.id,
          post_id: postId,
          read_at: new Date().toISOString()
        } as any, {
          onConflict: 'user_id,post_id'
        });

      if (error) throw error;
      
      return postId;
    },
    onSuccess: (postId) => {
      // Update the cache optimistically
      queryClient.setQueryData(['post-reads', user?.id], (oldData: any[]) => {
        if (!oldData) return [{ post_id: postId, read_at: new Date().toISOString() }];
        
        const exists = oldData.some(read => read.post_id === postId);
        if (!exists) {
          return [...oldData, { post_id: postId, read_at: new Date().toISOString() }];
        }
        return oldData;
      });
      
      console.log(`Marked post ${postId} as read`);
    },
    onError: (error) => {
      console.error('Error marking post as read:', error);
    }
  });

  return {
    readPostIds,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending
  };
};
