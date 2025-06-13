
import React, { useState, useEffect } from 'react';
import { useLocation, useStripe } from '@stripe/react-stripe-js';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentAmountSection } from './PaymentAmountSection';
import { PaymentMethodSection } from './PaymentMethodSection';
import { PaymentTerms } from './PaymentTerms';
import { PaymentButtons } from './PaymentButtons';
import { OrderSummary } from './OrderSummary';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';

export function PaymentForm() {
  const stripe = useStripe();
  const location = useLocation();
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState('');

  const { 
    clientSecret, 
    amount, 
    tierName, 
    tierId, 
    creatorId, 
    isUpgrade, 
    currentTierName, 
    proratedAmount, 
    fullTierPrice 
  } = location.state || {};

  // Calculate pricing details based on whether it's an upgrade or new subscription
  const monthlyAmount = isUpgrade ? (proratedAmount ? proratedAmount / 100 : 0) : (amount ? amount / 100 : 30);
  const fullTierMonthlyAmount = fullTierPrice ? fullTierPrice / 100 : monthlyAmount;
  const salesTax = monthlyAmount * 0.046; // 4.6% tax example
  const totalToday = monthlyAmount + salesTax;

  const {
    isProcessing,
    handlePayment,
    handleCancel
  } = usePaymentProcessing({
    clientSecret,
    tierId,
    creatorId,
    tierName,
    isUpgrade
  });

  useEffect(() => {
    if (!clientSecret) {
      toast({
        title: "Payment Error",
        description: "No payment information found. Please try subscribing again.",
        variant: "destructive"
      });
    }
    if (amount) {
      setPaymentAmount((monthlyAmount).toFixed(2));
    }
  }, [clientSecret, amount, monthlyAmount, toast]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading payment information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {isUpgrade ? 'Upgrade Payment' : 'Payment details'}
              </h1>
              {isUpgrade && (
                <p className="text-gray-400">
                  Upgrading from {currentTierName} to {tierName}
                </p>
              )}
            </div>

            <PaymentAmountSection
              isUpgrade={isUpgrade}
              currentTierName={currentTierName}
              tierName={tierName}
              monthlyAmount={monthlyAmount}
              fullTierMonthlyAmount={fullTierMonthlyAmount}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
            />

            <PaymentMethodSection />

            <PaymentTerms
              isUpgrade={isUpgrade}
              totalToday={totalToday}
              monthlyAmount={monthlyAmount}
              fullTierMonthlyAmount={fullTierMonthlyAmount}
            />

            <PaymentButtons
              isUpgrade={isUpgrade}
              isProcessing={isProcessing}
              onPayment={handlePayment}
              onCancel={handleCancel}
              stripe={stripe}
            />
          </div>

          {/* Right Column - Order Summary */}
          <OrderSummary
            isUpgrade={isUpgrade}
            currentTierName={currentTierName}
            tierName={tierName}
            monthlyAmount={monthlyAmount}
            fullTierMonthlyAmount={fullTierMonthlyAmount}
            salesTax={salesTax}
            totalToday={totalToday}
          />
        </div>
      </div>
    </div>
  );
}
