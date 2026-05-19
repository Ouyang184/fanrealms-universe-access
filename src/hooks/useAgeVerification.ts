
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useAgeVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const { data: isAgeVerified = false, isLoading } = useQuery({
    queryKey: ['age-verification', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('users')
        .select('age_verified')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching age verification status:', error);
        return false;
      }

      return data?.age_verified || false;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const verifyAgeMutation = useMutation({
    mutationFn: async (dateOfBirth: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Server-side validation: the RPC re-checks DOB >= 18 years ago
      // under SECURITY DEFINER. The DB trigger blocks any direct client
      // update to age_verified that doesn't satisfy the same rule.
      const { data, error } = await supabase.rpc('verify_age_with_dob', {
        p_date_of_birth: dateOfBirth,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || 'Age verification failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['age-verification', user?.id], true);
      setShowVerificationModal(false);
      toast({
        title: "Age verified",
        description: "You can now access 18+ content.",
      });
    },
    onError: (error) => {
      console.error('Error verifying age:', error);
      toast({
        title: "Verification failed",
        description: "Unable to verify age. Please try again.",
        variant: "destructive",
      });
    }
  });

  const requestAgeVerification = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to verify your age.",
        variant: "destructive",
      });
      return;
    }
    
    setShowVerificationModal(true);
  };

  const handleAgeVerified = (dateOfBirth: string) => {
    verifyAgeMutation.mutate(dateOfBirth);
  };

  return {
    isAgeVerified,
    isLoading,
    showVerificationModal,
    setShowVerificationModal,
    requestAgeVerification,
    handleAgeVerified,
    isVerifying: verifyAgeMutation.isPending
  };
};
