
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useEmailMFA() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkEmailMFAStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email_2fa_enabled')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsEnabled(data?.email_2fa_enabled || false);
    } catch (error: any) {
      console.error('Error checking email MFA status:', error);
    }
  };

  const enableEmailMFA = async () => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ email_2fa_enabled: true })
        .eq('id', user.id);

      if (error) throw error;

      setIsEnabled(true);
      toast({
        title: "Email 2FA Enabled",
        description: "Two-factor authentication via email has been enabled for your account.",
      });

      return true;
    } catch (error: any) {
      console.error('Error enabling email MFA:', error);
      toast({
        title: "Error",
        description: "Failed to enable email 2FA. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disableEmailMFA = async () => {
    if (!user) return false;

    setIsLoading(true);
    try {
      // Disable email 2FA
      const { error: userError } = await supabase
        .from('users')
        .update({ email_2fa_enabled: false })
        .eq('id', user.id);

      if (userError) throw userError;

      // Note: Client no longer attempts to delete from email_2fa_codes.
      // These codes are now service-role managed and auto-cleaned by the database function within ~15 minutes.
      console.log('[Email 2FA] Disabled; any existing codes will auto-expire and be cleaned up by the server.');

      setIsEnabled(false);
      toast({
        title: "Email 2FA Disabled",
        description: "Two-factor authentication via email has been disabled.",
      });

      return true;
    } catch (error: any) {
      console.error('Error disabling email MFA:', error);
      toast({
        title: "Error",
        description: "Failed to disable email 2FA. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendVerificationCode = async (email: string) => {
    setIsLoading(true);
    try {
      // Call the send-code Edge Function
      const { data, error } = await supabase.functions.invoke('send-code', {
        body: { email }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send verification code');
      }

      toast({
        title: "Verification code sent",
        description: "Check your email for the 6-digit verification code"
      });

      return true;
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      toast({
        title: "Failed to send code",
        description: error.message || "Could not send verification code",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkEmailMFAStatus();
  }, [user]);

  return {
    isEnabled,
    isLoading,
    enableEmailMFA,
    disableEmailMFA,
    sendVerificationCode,
    checkEmailMFAStatus
  };
}
