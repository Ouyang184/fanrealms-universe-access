
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UseNSFWPreferenceOptions {
  onAgeVerificationRequired?: () => Promise<boolean>;
  isAgeVerified?: boolean; // Add this to use external age verification state
}

export const useNSFWPreference = (options?: UseNSFWPreferenceOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: showNSFW = false, isLoading } = useQuery({
    queryKey: ['nsfw-preference', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      console.log('Fetching NSFW preference for user:', user.id);
      
      const { data, error } = await supabase
        .from('users')
        .select('is_nsfw_enabled')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching NSFW preference:', error);
        return false;
      }

      const result = data?.is_nsfw_enabled || false;
      console.log('NSFW preference fetched:', result);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  const updateNSFWPreference = useMutation({
    mutationFn: async (enabled: boolean) => {
      console.log('🔥 useNSFWPreference - Updating NSFW preference to:', enabled);
      
      if (!user?.id) throw new Error('User not authenticated');

      // If trying to enable NSFW, check age verification first
      if (enabled && options?.onAgeVerificationRequired) {
        console.log('🚨 useNSFWPreference - Checking age verification for NSFW enable');
        
        // Use the passed age verification status if available, otherwise check database
        const isCurrentlyVerified = options.isAgeVerified !== undefined 
          ? options.isAgeVerified 
          : await checkDatabaseAgeVerification();

        console.log('🔍 useNSFWPreference - Age verification check:', { 
          isCurrentlyVerified,
          passedValue: options.isAgeVerified 
        });

        if (!isCurrentlyVerified) {
          console.log('🚨 useNSFWPreference - Age verification required, calling callback');
          const isVerified = await options.onAgeVerificationRequired();
          if (!isVerified) {
            throw new Error('Age verification required');
          }
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          is_nsfw_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      console.log('✅ useNSFWPreference - NSFW preference updated successfully');
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
      console.error('❌ useNSFWPreference - Error updating NSFW preference:', error);
      if (error.message !== 'Age verification required') {
        toast({
          title: "Error",
          description: "Failed to update NSFW preference. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  // Helper function to check database age verification
  const checkDatabaseAgeVerification = async (): Promise<boolean> => {
    const { data: userData, error } = await supabase
      .from('users')
      .select('age_verified')
      .eq('id', user.id)
      .single();

    return !error && userData?.age_verified;
  };

  return {
    showNSFW,
    isLoading,
    updateNSFWPreference: updateNSFWPreference.mutate,
    isUpdating: updateNSFWPreference.isPending
  };
};
