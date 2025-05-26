
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { StripePaymentForm } from '@/components/creator/StripePaymentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, User, HelpCircle, DollarSign } from 'lucide-react';

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
    // Check if there's a success callback to trigger
    const hasCallback = sessionStorage.getItem('subscriptionSuccessCallback');
    const callbackCreatorId = sessionStorage.getItem('subscriptionCreatorId');
    const callbackTierId = sessionStorage.getItem('subscriptionTierId');
    
    if (hasCallback && callbackCreatorId === creatorId && callbackTierId === tierId) {
      // Clear the callback flags
      sessionStorage.removeItem('subscriptionSuccessCallback');
      sessionStorage.removeItem('subscriptionCreatorId');
      sessionStorage.removeItem('subscriptionTierId');
      
      // Trigger a custom event that the creator page can listen to
      window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
        detail: { creatorId, tierId }
      }));
    }
    
    navigate('/feed', { 
      state: { 
        showSuccessMessage: true,
        tierName 
      }
    });
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  const monthlyAmount = amount / 100;
  const oneTimeCredit = 10.00;
  const salesTax = monthlyAmount * 0.046; // ~4.6% tax
  const totalDue = monthlyAmount - oneTimeCredit + salesTax;

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - Payment Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Payment details</h1>
              </div>

              {/* Payment Amount Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Payment amount</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pay the set price or you can choose to pay more.
                  </p>
                </div>

                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Monthly payment</div>
                        <div className="text-sm text-muted-foreground">${monthlyAmount.toFixed(2)}/month</div>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="font-medium">{monthlyAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment method</h3>
                <StripePaymentForm
                  clientSecret={clientSecret}
                  amount={amount}
                  tierName={tierName}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>

              {/* Payment Info */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  You'll pay ${totalDue.toFixed(2)} today, and then ${monthlyAmount.toFixed(2)} monthly on the 1st. Your next charge will be on 1 June.
                </p>
                <p>
                  By clicking Subscribe now, you agree to our Terms of Use and Privacy Policy. This subscription automatically renews monthly, and you'll be notified in advance if the monthly amount increases. Cancel at any time in your membership settings.
                </p>
              </div>
            </div>

            {/* Right Side - Order Summary */}
            <div className="lg:pl-8">
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Order summary</h2>
                  
                  {/* Creator Info */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Creator</div>
                      <div className="text-sm text-muted-foreground">{tierName}</div>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Monthly payment</span>
                      <span>${monthlyAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>One-time credit</span>
                      <span>-${oneTimeCredit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sales Tax</span>
                      <span>${salesTax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total due today</span>
                        <span>${totalDue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Section */}
              <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help Centre</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
