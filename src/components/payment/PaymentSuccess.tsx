
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';

interface PaymentSuccessProps {
  isUpgrade: boolean;
  tierName: string;
  isVerifying: boolean;
}

export function PaymentSuccess({ isUpgrade, tierName, isVerifying }: PaymentSuccessProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
        <CardContent className="pt-6 text-center">
          <div className="mb-6">
            {isVerifying ? (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              {isVerifying 
                ? "Processing Payment..." 
                : (isUpgrade ? "Upgrade Successful!" : "Payment Successful!")
              }
            </h2>
            
            {isVerifying ? (
              <div className="space-y-2">
                <p className="text-gray-400">
                  {isUpgrade ? "Processing your upgrade..." : "Activating your subscription..."}
                </p>
                <p className="text-sm text-gray-500">
                  Please wait while we confirm your payment with Stripe and activate your subscription.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-400">
                  {isUpgrade 
                    ? `You've successfully upgraded to ${tierName}!`
                    : `You've successfully subscribed to ${tierName}!`
                  }
                </p>
                <p className="text-sm text-green-500 font-medium">
                  ✓ Payment confirmed in Stripe
                </p>
                <p className="text-sm text-green-500 font-medium">
                  ✓ Subscription activated in database
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to your subscriptions...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
