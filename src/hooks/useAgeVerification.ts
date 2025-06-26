
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useAgeVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const checkAgeVerification = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('age_verified')
          .eq('id', user.id as any)
          .single();

        if (error) {
          console.error('Error checking age verification:', error);
          setIsVerified(false);
        } else {
          setIsVerified((data as any)?.age_verified || false);
        }
      } catch (error) {
        console.error('Error in age verification check:', error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAgeVerification();
  }, [user?.id]);

  const verifyAge = async (dateOfBirth: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          age_verified: true,
          date_of_birth: dateOfBirth,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id as any);

      if (error) throw error;

      setIsVerified(true);
      setShowVerificationModal(false);
      
      toast({
        title: "Age verified",
        description: "Your age has been verified successfully.",
      });
    } catch (error: any) {
      console.error('Error verifying age:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify age. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleAgeVerified = async (dateOfBirth: string) => {
    await verifyAge(dateOfBirth);
  };

  return {
    isVerified,
    isLoading,
    verifyAge,
    isAgeVerified: isVerified,
    showVerificationModal,
    setShowVerificationModal,
    handleAgeVerified,
  };
}
