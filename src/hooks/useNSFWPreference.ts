
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useNSFWPreference = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: showNSFW = false, isLoading } = useQuery({
    queryKey: ['nsfw-preference', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('category_id')
        .eq('user_id', user.id)
        .eq('category_name', 'nsfw_content')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching NSFW preference:', error);
        return false;
      }

      return data ? data.category_id === 1 : false;
    },
    enabled: !!user?.id
  });

  const updateNSFWPreference = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Delete existing NSFW preference
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('category_name', 'nsfw_content');

      // Insert new NSFW preference
      const { error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          category_id: enabled ? 1 : 0,
          category_name: 'nsfw_content'
        });

      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.setQueryData(['nsfw-preference', user?.id], enabled);
      toast({
        title: "NSFW preference updated",
        description: `NSFW content is now ${enabled ? 'enabled' : 'disabled'}.`
      });
    },
    onError: (error) => {
      console.error('Error updating NSFW preference:', error);
      toast({
        title: "Error",
        description: "Failed to update NSFW preference. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    showNSFW,
    isLoading,
    updateNSFWPreference: updateNSFWPreference.mutate,
    isUpdating: updateNSFWPreference.isPending
  };
};
