
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CREATOR_SAFE_COLUMNS } from "@/lib/creatorColumns";

export function useCreatorProfile() {
  const { user } = useAuth();

  const { data: creatorProfile, isLoading } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select(CREATOR_SAFE_COLUMNS)
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  return {
    creatorProfile,
    isLoading,
    isCreator: !!creatorProfile
  };
}
