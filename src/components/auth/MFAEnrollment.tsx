import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MFAEnrollmentProps {
  onEnrollmentComplete: () => void;
  onCancel: () => void;
}

export function MFAEnrollment({ onEnrollmentComplete, onCancel }: MFAEnrollmentProps) {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [factorId, setFactorId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const startEnrollment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep('verify');
      }
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      setError(error.message || 'Failed to start MFA enrollment');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEnrollment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      toast({
        title: "2FA Enabled Successfully",
        description: "Your account is now protected with two-factor authentication.",
      });

      onEnrollmentComplete();
    } catch (error: any) {
      console.error('MFA verification error:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'setup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Enable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by enabling 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You'll need an authenticator app like Google Authenticator, Authy, or 1Password to generate verification codes.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={startEnrollment} disabled={isLoading} className="flex-1">
              {isLoading ? 'Setting up...' : 'Set up 2FA'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set up Authenticator App</CardTitle>
        <CardDescription>
          Scan the QR code with your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center space-y-4">
          {qrCode && (
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={qrCode} size={200} />
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Can't scan the QR code? Enter this secret manually:
            </p>
            <code className="text-xs bg-muted p-2 rounded break-all">{secret}</code>
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
          </div>

          <div className="flex gap-2 w-full">
            <Button 
              onClick={verifyEnrollment} 
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify & Enable'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}