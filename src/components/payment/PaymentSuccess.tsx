
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              {isUpgrade ? "Upgrade Successful!" : "Payment Successful!"}
            </h2>
            {isVerifying ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-gray-400">
                  {isUpgrade ? "Processing your upgrade..." : "Activating your subscription..."}
                </p>
              </div>
            ) : (
              <p className="text-gray-400">
                {isUpgrade 
                  ? `You've successfully upgraded to ${tierName}. Redirecting to your subscriptions...`
                  : `You've successfully subscribed to ${tierName}. Redirecting to your subscriptions...`
                }
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
