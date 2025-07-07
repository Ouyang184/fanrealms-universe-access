
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simulate verification process
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Payment Error</h1>
            <p className="text-gray-400 mb-6">No payment session found.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isVerifying ? (
              <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isVerifying ? 'Processing Payment...' : 'Payment Successful!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {isVerifying ? (
            <>
              <p className="text-gray-400">
                We're verifying your payment and setting up your subscription.
              </p>
              <p className="text-sm text-gray-500">
                This usually takes just a few seconds.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-400 mb-6">
                Your subscription has been activated successfully! You now have access to exclusive content.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/subscriptions')} 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  View My Subscriptions
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline" 
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Return Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
