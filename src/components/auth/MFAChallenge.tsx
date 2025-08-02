import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface MFAChallengeProps {
  factorId: string;
  challengeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAChallenge({ factorId, challengeId, onSuccess, onCancel }: MFAChallengeProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyChallenge = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode
      });

      if (error) throw error;

      onSuccess();
    } catch (error: any) {
      console.error('MFA challenge verification error:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app
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
            onClick={verifyChallenge} 
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}