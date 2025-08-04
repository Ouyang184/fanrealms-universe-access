import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailTwoFactorChallengeProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmailTwoFactorChallenge({ email, onSuccess, onCancel }: EmailTwoFactorChallengeProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const { toast } = useToast();

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not found");
      }

      // Verify the code
      const { data: codeData, error: codeError } = await supabase
        .from('email_2fa_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('code', code)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (codeError || !codeData) {
        setAttempts(prev => prev + 1);
        
        // Increment attempts in database
        await supabase
          .from('email_2fa_codes')
          .update({ attempts: attempts + 1 })
          .eq('user_id', user.id)
          .eq('code', code);

        toast({
          title: "Invalid code",
          description: "The verification code is incorrect or has expired",
          variant: "destructive"
        });
        return;
      }

      // Mark code as used
      const { error: updateError } = await supabase
        .from('email_2fa_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', codeData.id);

      if (updateError) {
        console.error('Error marking code as used:', updateError);
      }

      toast({
        title: "Verification successful",
        description: "You have been successfully signed in"
      });

      onSuccess();

    } catch (error: any) {
      console.error('2FA verification error:', error);
      setAttempts(prev => prev + 1);
      toast({
        title: "Verification failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      const response = await fetch('https://eaeqyctjljbtcatlohky.supabase.co/functions/v1/send-2fa-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZXF5Y3RqbGpidGNhdGxvaGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODE1OTgsImV4cCI6MjA2MTM1NzU5OH0.FrxmM9nqPNUjo3ZTMUdUWPirm0q1WFssoierxq9zb7A`
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend code');
      }

      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email"
      });

      setCode("");
      setAttempts(0);

    } catch (error: any) {
      toast({
        title: "Failed to resend",
        description: error.message || "Could not resend verification code",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {attempts >= 3 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                Multiple failed attempts detected. Please try again in a few minutes.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isVerifying || code.length !== 6 || attempts >= 5}
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </Button>
            
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-sm"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend code"
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}