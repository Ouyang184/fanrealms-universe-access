
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TermsHeader } from '@/components/terms/TermsHeader';
import { TermsContent } from '@/components/terms/TermsContent';
import { TermsAgreement } from '@/components/terms/TermsAgreement';

interface PendingSignupData {
  fullName: string;
  email: string;
  password: string;
}

export default function Terms() {
  const [pendingSignupData, setPendingSignupData] = useState<PendingSignupData | null>(null);
  const [isProcessingSignup, setIsProcessingSignup] = useState(false);
  const navigate = useNavigate();

  // Optimize initial data loading
  useEffect(() => {
    // Use requestIdleCallback for non-critical operations
    const loadPendingData = () => {
      const storedData = localStorage.getItem('pending_signup_data');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          console.log('Parsed signup data:', parsedData);
          
          if (parsedData.email && parsedData.password && parsedData.fullName) {
            setPendingSignupData(parsedData);
          } else {
            console.error('Invalid signup data structure:', parsedData);
            toast.error('Invalid signup data. Please try signing up again.');
            localStorage.removeItem('pending_signup_data');
            navigate('/signup');
          }
        } catch (error) {
          console.error('Error parsing stored signup data:', error);
          localStorage.removeItem('pending_signup_data');
          toast.error('Error processing signup data. Please try again.');
          navigate('/signup');
        }
      }
    };

    if (window.requestIdleCallback) {
      requestIdleCallback(loadPendingData);
    } else {
      // Fallback for older browsers
      setTimeout(loadPendingData, 0);
    }
  }, [navigate]);

  const getBackLink = () => {
    if (pendingSignupData) return '/signup';
    return '/';
  };

  const getBackText = () => {
    if (pendingSignupData) return 'Back to Signup';
    return 'Back to Home';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <TermsHeader 
          pendingSignupData={pendingSignupData}
          getBackLink={getBackLink}
          getBackText={getBackText}
        />

        {/* Server load warning only when processing */}
        {isProcessingSignup && (
          <Alert className="mt-4 bg-yellow-900/20 border-yellow-800">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-yellow-200">
              Creating your account... This may take a moment due to high server traffic.
            </AlertDescription>
          </Alert>
        )}

        <TermsContent />
        
        <div className="mt-8">
          <TermsAgreement pendingSignupData={pendingSignupData} />
        </div>
      </div>
    </div>
  );
}
