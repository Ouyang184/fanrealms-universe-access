
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export const useUserPreferences = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('category_id, category_name')
        .eq('user_id', user.id as any);

      if (error) {
        console.error('Error fetching user preferences:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id
  });
};
