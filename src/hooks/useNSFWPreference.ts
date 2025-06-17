
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
      
      console.log('Fetching NSFW preference for user:', user.id);
      
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

      const result = data ? data.category_id === 1 : false;
      console.log('NSFW preference fetched:', result);
      return result;
    },
    enabled: !!user?.id
  });

  const updateNSFWPreference = useMutation({
    mutationFn: async (enabled: boolean) => {
      console.log('Updating NSFW preference to:', enabled);
      
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
      
      console.log('NSFW preference updated successfully');
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

  console.log('Hook state:', { showNSFW, isLoading, isUpdating: updateNSFWPreference.isPending });

  return {
    showNSFW,
    isLoading,
    updateNSFWPreference: updateNSFWPreference.mutate,
    isUpdating: updateNSFWPreference.isPending
  };
};
