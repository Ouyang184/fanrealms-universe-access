
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePostShares(postId: string) {
  const { data: shareCount, isLoading } = useQuery({
    queryKey: ['postShares', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_shares')
        .select('id')
        .eq('post_id', postId);
      
      if (error) {
        console.error('Error fetching share count:', error);
        return 0;
      }
      
      return data?.length || 0;
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  return {
    shareCount: shareCount || 0,
    isLoading
  };
}
