
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { StripePaymentForm } from '@/components/creator/StripePaymentForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { clientSecret, amount, tierName, tierId, creatorId } = location.state || {};

  // If no payment data is available, redirect back
  if (!clientSecret || !amount || !tierName) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Payment Information Missing</h2>
          <p className="text-muted-foreground mb-6">
            No payment information was found. Please try subscribing again.
          </p>
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handlePaymentSuccess = () => {
    navigate('/feed', { 
      state: { 
        showSuccessMessage: true,
        tierName 
      }
    });
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Stay on the payment page to allow retry
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Complete Your Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Subscribe to {tierName} and unlock exclusive content
          </p>
        </div>

        <StripePaymentForm
          clientSecret={clientSecret}
          amount={amount}
          tierName={tierName}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </MainLayout>
  );
}
