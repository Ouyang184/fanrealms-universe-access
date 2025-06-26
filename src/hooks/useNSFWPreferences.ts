
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export const useNSFWPreferences = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["nsfw-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return { isNSFWEnabled: false };
      
      const { data, error } = await supabase
        .from('users')
        .select('is_nsfw_enabled')
        .eq('id', user.id as any)
        .single();

      if (error) {
        console.error('Error fetching NSFW preferences:', error);
        return { isNSFWEnabled: false };
      }

      return { isNSFWEnabled: (data as any)?.is_nsfw_enabled || false };
    },
    enabled: !!user?.id
  });
};
