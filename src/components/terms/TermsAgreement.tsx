
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useAuthFunctions } from '@/hooks/useAuthFunctions';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PendingSignupData {
  fullName: string;
  email: string;
  password: string;
}

interface TermsAgreementProps {
  pendingSignupData: PendingSignupData | null;
}

export function TermsAgreement({ pendingSignupData }: TermsAgreementProps) {
  const [finalAgreement, setFinalAgreement] = useState<boolean>(false);
  const [isProcessingSignup, setIsProcessingSignup] = useState(false);
  const { signUp } = useAuthFunctions();
  const navigate = useNavigate();

  const handleAcceptContinue = async () => {
    if (!finalAgreement) {
      toast.error('Please accept the terms to continue');
      return;
    }

    if (pendingSignupData) {
      try {
        setIsProcessingSignup(true);
        console.log('Processing optimized signup with data:', pendingSignupData);
        
        const result = await signUp(pendingSignupData.email, pendingSignupData.password);
        console.log('Signup result:', result);
        
        if (!result.success) {
          console.error('Signup failed:', result.error);
          return;
        }
        
        // Optimize localStorage operations
        requestIdleCallback(() => {
          localStorage.setItem("user_fullname", pendingSignupData.fullName);
          localStorage.removeItem('pending_signup_data');
        });
        
        navigate("/login", { replace: true });
        
      } catch (error: any) {
        console.error("Unexpected signup error:", error);
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setIsProcessingSignup(false);
      }
    } else {
      navigate('/');
    }
  };

  const handleDecline = () => {
    // Use requestIdleCallback for non-critical operations
    requestIdleCallback(() => {
      localStorage.removeItem('pending_signup_data');
    });
    navigate('/');
  };

  const handleTryDifferentEmail = () => {
    requestIdleCallback(() => {
      localStorage.removeItem('pending_signup_data');
    });
    navigate('/signup');
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle>9. Final Consent & Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="font-medium">By checking ✅ I Agree, you confirm:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You read and accept all terms.</li>
            <li>You understand that multiple accounts from the same IP are allowed.</li>
          </ul>
          
          <div className="p-6 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="final-agreement"
                checked={finalAgreement}
                onCheckedChange={(checked) => setFinalAgreement(!!checked)}
              />
              <label htmlFor="final-agreement" className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                I Agree to All Terms
              </label>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Button 
              size="lg" 
              onClick={handleAcceptContinue}
              disabled={isProcessingSignup || !finalAgreement}
            >
              {isProcessingSignup ? (
                <div className="flex items-center">
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Creating Account...
                </div>
              ) : (
                pendingSignupData ? "Accept & Create Account" : "Accept & Continue"
              )}
            </Button>
            
            <Button variant="outline" size="lg" onClick={handleDecline}>
              Decline & Exit
            </Button>

            {pendingSignupData && !isProcessingSignup && (
              <Button variant="secondary" size="lg" onClick={handleTryDifferentEmail}>
                Try Different Email
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
