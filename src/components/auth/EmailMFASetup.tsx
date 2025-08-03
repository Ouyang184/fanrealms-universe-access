import { useState } from "react";
import { Mail } from "lucide-react";
import { Turnstile } from '@marsidev/react-turnstile';
import { TURNSTILE_SITE_KEY } from '@/config/turnstile';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function EmailMFASetup() {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const sendVerificationEmail = async () => {
    if (!user?.email) return;
    
    if (!captchaToken) {
      setError('Please complete the security check');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
          captchaToken: captchaToken,
        }
      });

      if (error) throw error;

      setStep('verify');
      toast({
        title: "Verification email sent",
        description: "Check your email for the 6-digit verification code.",
      });
    } catch (error: any) {
      console.error('Email MFA setup error:', error);
      setError(error.message || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!user?.email) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: verificationCode,
        type: 'email'
      });

      if (error) throw error;

      // Update user metadata to indicate email 2FA is enabled
      const { error: updateError } = await supabase.auth.updateUser({
        data: { email_2fa_enabled: true }
      });

      if (updateError) throw updateError;

      toast({
        title: "Email 2FA Enabled",
        description: "Two-factor authentication via email has been enabled for your account.",
      });

      setStep('send');
      setVerificationCode('');
    } catch (error: any) {
      console.error('Email verification error:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verify Email Code</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={verifyCode} 
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify & Enable'}
            </Button>
            <Button variant="outline" onClick={() => setStep('send')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Enable Email 2FA</CardTitle>
        <CardDescription>
          Add an extra layer of security by requiring email verification codes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3 p-4 border rounded-lg">
          <Mail className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium">Email Verification</p>
            <p className="text-sm text-muted-foreground">
              We'll send a 6-digit code to {user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            When enabled, you'll receive a verification code via email each time you sign in.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Security Check</Label>
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => {
              setCaptchaToken(token);
              setError(null);
            }}
            onError={() => {
              setCaptchaToken("");
              setError("CAPTCHA verification failed. Please try again.");
            }}
            onExpire={() => {
              setCaptchaToken("");
              setError("CAPTCHA expired. Please try again.");
            }}
          />
        </div>

        <Button 
          onClick={sendVerificationEmail} 
          disabled={isLoading || !captchaToken} 
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Verification Email'}
        </Button>
      </CardContent>
    </Card>
  );
}