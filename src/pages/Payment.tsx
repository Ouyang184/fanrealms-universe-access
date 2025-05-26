
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { success, tierName } = location.state || {};

  useEffect(() => {
    // If this is a success page, show success message
    if (success && tierName) {
      // Optional: You could add a timer to redirect to feed after a few seconds
      // setTimeout(() => navigate('/feed'), 3000);
    }
  }, [success, tierName, navigate]);

  // If this is a success return from Stripe
  if (success) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4 text-green-700">Payment Successful!</h2>
            <p className="text-lg text-muted-foreground mb-6">
              You've successfully subscribed to {tierName || 'the tier'}.
            </p>
            <p className="text-muted-foreground mb-8">
              You now have access to exclusive content and features.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button onClick={() => navigate('/feed')} className="mr-4">
              Go to Feed
            </Button>
            <Button variant="outline" onClick={() => navigate('/subscriptions')}>
              View Subscriptions
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // If no payment data and not a success page, redirect back
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Payment Information Missing</h2>
        <p className="text-muted-foreground mb-6">
          No payment information was found. Please try subscribing again.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    </MainLayout>
  );
}
