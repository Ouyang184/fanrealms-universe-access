import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [sessionData, setSessionData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setVerificationStatus('error');
      setIsVerifying(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        console.log('Verifying payment session:', sessionId);
        
        // Call edge function to verify the checkout session
        const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
          body: {
            action: 'verify_checkout_session',
            session_id: sessionId
          }
        });

        if (error) {
          console.error('Payment verification error:', error);
          throw error;
        }

        if (data?.error) {
          console.error('Payment verification failed:', data.error);
          throw new Error(data.error);
        }

        console.log('Payment verification successful:', data);
        setSessionData(data);
        setVerificationStatus('success');
        
        toast({
          title: "Payment Successful!",
          description: data.isUpgrade 
            ? `Successfully upgraded to ${data.tierName}!`
            : `Welcome to ${data.tierName}! Your subscription is now active.`,
        });

      } catch (error) {
        console.error('Failed to verify payment:', error);
        setVerificationStatus('error');
        
        toast({
          title: "Payment Verification Failed",
          description: "We couldn't verify your payment. Please contact support if you were charged.",
          variant: "destructive"
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, toast]);

  const handleContinue = () => {
    if (sessionData?.creatorId) {
      navigate(`/creator/${sessionData.creatorId}`);
    } else {
      navigate('/dashboard');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Payment Session</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No payment session found. Please try subscribing again.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {verificationStatus === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <CardTitle>Verifying Payment...</CardTitle>
            </>
          )}
          
          {verificationStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle>
                {sessionData?.isUpgrade ? 'Upgrade Successful!' : 'Payment Successful!'}
              </CardTitle>
            </>
          )}
          
          {verificationStatus === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <CardTitle>Payment Verification Failed</CardTitle>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {verificationStatus === 'loading' && (
            <p className="text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          )}
          
          {verificationStatus === 'success' && sessionData && (
            <>
              <p className="text-muted-foreground">
                {sessionData.isUpgrade 
                  ? `You've successfully upgraded to ${sessionData.tierName}!`
                  : `Welcome to ${sessionData.tierName}! Your subscription is now active.`
                }
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{sessionData.tierName}</p>
                <p className="text-sm text-muted-foreground">
                  {sessionData.creatorName && `by ${sessionData.creatorName}`}
                </p>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Continue
              </Button>
            </>
          )}
          
          {verificationStatus === 'error' && (
            <>
              <p className="text-muted-foreground">
                We couldn't verify your payment. If you were charged, please contact support.
              </p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                  Try Again
                </Button>
                <Button onClick={handleContinue} className="w-full">
                  Continue Anyway
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}