
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UseNSFWPreferenceOptions {
  onAgeVerificationRequired?: () => Promise<boolean>;
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
        .eq('id', user.id as any)
        .single();

      if (error) {
        console.error('Error fetching NSFW preference:', error);
        return false;
      }

      const result = (data as any)?.is_nsfw_enabled || false;
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

      // If trying to enable NSFW, ALWAYS check age verification from database
      if (enabled) {
        console.log('🚨 useNSFWPreference - Checking age verification from database');
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('age_verified')
          .eq('id', user.id as any)
          .single();

        console.log('🔍 useNSFWPreference - Database age verification check:', { 
          userData, 
          error,
          age_verified: (userData as any)?.age_verified 
        });

        const isAgeVerified = !error && (userData as any)?.age_verified;

        if (!isAgeVerified && options?.onAgeVerificationRequired) {
          console.log('🚨 useNSFWPreference - Age verification required, calling callback');
          const verificationResult = await options.onAgeVerificationRequired();
          console.log('🎯 useNSFWPreference - Verification callback result:', verificationResult);
          
          if (!verificationResult) {
            console.log('❌ useNSFWPreference - Age verification failed or cancelled');
            throw new Error('Age verification required');
          }
        } else if (!isAgeVerified) {
          console.log('❌ useNSFWPreference - Age verification required but no callback provided');
          throw new Error('Age verification required');
        }
      }

      const { error } = await supabase
        .from('users')
        .update({
          is_nsfw_enabled: enabled,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', user.id as any);

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

  return {
    showNSFW,
    isLoading,
    updateNSFWPreference: updateNSFWPreference.mutate,
    isUpdating: updateNSFWPreference.isPending
  };
};
