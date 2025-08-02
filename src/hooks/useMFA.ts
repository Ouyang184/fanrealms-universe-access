import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MFAFactor {
  id: string;
  factor_type?: string;
  friendly_name?: string;
  status: 'unverified' | 'verified';
}

export function useMFA() {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFactors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;
      
      // Map Supabase Factor to our MFAFactor interface
      const mappedFactors = (data?.totp || []).map(factor => ({
        id: factor.id,
        factor_type: factor.factor_type || 'totp',
        friendly_name: factor.friendly_name || 'Authenticator App',
        status: factor.status as 'unverified' | 'verified'
      }));
      
      setFactors(mappedFactors);
    } catch (error: any) {
      console.error('Error fetching MFA factors:', error);
      toast({
        title: "Error",
        description: "Failed to load 2FA settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unenrollFactor = async (factorId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.mfa.unenroll({
        factorId
      });

      if (error) throw error;

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });

      await fetchFactors();
    } catch (error: any) {
      console.error('Error unenrolling MFA factor:', error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createChallenge = async (factorId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (error) throw error;

      return data?.id;
    } catch (error: any) {
      console.error('Error creating MFA challenge:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  return {
    factors,
    isLoading,
    fetchFactors,
    unenrollFactor,
    createChallenge,
    hasMFA: factors.some(factor => factor.status === 'verified')
  };
}