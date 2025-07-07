
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId || !user) {
      navigate('/');
      return;
    }

    const verifyPayment = async () => {
      try {
        console.log('Verifying payment for session:', sessionId);
        
        // Wait a moment for webhook processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
          body: {
            action: 'verify_checkout_session',
            sessionId: sessionId
          }
        });

        if (error) {
          console.error('Error verifying payment:', error);
          toast({
            title: "Verification Error",
            description: "There was an issue verifying your payment. Please contact support if you were charged.",
            variant: "destructive"
          });
          navigate('/subscriptions');
          return;
        }

        if (data?.success) {
          console.log('Payment verified successfully');
          setVerificationComplete(true);
          
          toast({
            title: "Subscription Active!",
            description: data.isUpgrade 
              ? `Successfully upgraded to ${data.tierName}`
              : `Successfully subscribed to ${data.tierName}`,
          });

          // Redirect after showing success
          setTimeout(() => {
            navigate('/subscriptions');
          }, 3000);
        } else {
          console.warn('Payment verification failed:', data);
          toast({
            title: "Verification Pending",
            description: "Your payment is processing. Please check your subscriptions page.",
          });
          navigate('/subscriptions');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Verification Error",
          description: "Unable to verify payment. Please check your subscriptions page.",
          variant: "destructive"
        });
        navigate('/subscriptions');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, user, navigate, toast]);

  if (!sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            {isVerifying ? (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-blue-500" />
                <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                <p className="text-gray-400">
                  Please wait while we confirm your subscription...
                </p>
              </>
            ) : verificationComplete ? (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold text-green-500 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-400">
                  Your subscription is now active. Redirecting to your subscriptions...
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-2xl font-bold text-yellow-500 mb-2">
                  Payment Processing
                </h2>
                <p className="text-gray-400">
                  Your payment is being processed. Redirecting...
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
