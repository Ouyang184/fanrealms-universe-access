
import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle, Check } from 'lucide-react';

interface PatreonStylePaymentFormProps {
  clientSecret: string;
  tierName: string;
  amount: number;
  isUpgrade?: boolean;
  creatorName?: string;
}

function PaymentFormContent({ 
  clientSecret, 
  tierName, 
  amount, 
  isUpgrade = false,
  creatorName = "Creator"
}: PatreonStylePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'annual'>('monthly');
  
  // Calculate pricing
  const monthlyPrice = amount / 100;
  const annualPrice = Math.round(monthlyPrice * 12 * 0.7); // 30% savings
  const annualMonthlyEquivalent = annualPrice / 12;
  const salesTax = 0.96; // This should be calculated based on user location
  
  const currentPrice = billingFrequency === 'monthly' ? monthlyPrice : annualPrice;
  const totalDueToday = currentPrice + salesTax;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !confirmed) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {isUpgrade ? 'Upgrade your membership' : 'Become a member'}
              </h1>
              <p className="text-gray-400">
                {isUpgrade ? `Upgrade to ${tierName}` : `Join ${tierName}`} to unlock exclusive content and perks
              </p>
            </div>

            {/* Billing Frequency */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Choose your billing</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={billingFrequency} 
                  onValueChange={(value: 'monthly' | 'annual') => setBillingFrequency(value)}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="text-white font-medium">
                        Monthly
                      </Label>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">${monthlyPrice.toFixed(2)}/month</div>
                      <div className="text-sm text-gray-400">Billed monthly</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg relative">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="annual" id="annual" />
                      <Label htmlFor="annual" className="text-white font-medium">
                        Annual
                        <span className="ml-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                          Save 30%
                        </span>
                      </Label>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">${annualMonthlyEquivalent.toFixed(2)}/month</div>
                      <div className="text-sm text-gray-400">${annualPrice}/year</div>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Payment method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <span className="text-white">Credit or debit card</span>
                  </div>
                  <Check className="h-5 w-5 text-green-500" />
                </div>

                <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#ffffff',
                          backgroundColor: '#374151',
                          '::placeholder': {
                            color: '#9CA3AF',
                          },
                        },
                      },
                    }}
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-200">{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Terms */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                className="border-gray-600 data-[state=checked]:bg-orange-600 mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                By continuing, you agree to pay ${totalDueToday.toFixed(2)} {billingFrequency === 'monthly' ? 'monthly' : 'annually'} 
                {' '}(plus applicable taxes) until you cancel your membership. 
                You can cancel anytime in your settings.
              </Label>
            </div>

            {/* Subscribe Button */}
            <Button
              onClick={handleSubmit}
              disabled={!stripe || !confirmed || isProcessing}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Join for $${totalDueToday.toFixed(2)}`
              )}
            </Button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:pl-8">
            <Card className="bg-gray-900 border-gray-800 sticky top-6">
              <CardHeader>
                <CardTitle className="text-white">
                  {isUpgrade ? 'Upgrade summary' : 'Order summary'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Creator Info */}
                <div className="flex items-center space-x-3 pb-4 border-b border-gray-700">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {creatorName?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{creatorName}</div>
                    <div className="text-gray-400 text-sm">{tierName}</div>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {billingFrequency === 'monthly' ? 'Monthly payment' : 'Annual payment'}
                    </span>
                    <span className="text-white">${currentPrice.toFixed(2)}</span>
                  </div>
                  
                  {billingFrequency === 'annual' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">One-time credit</span>
                      <span className="text-green-400">-${(monthlyPrice * 12 - annualPrice).toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sales Tax</span>
                    <span className="text-white">${salesTax.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-3 border-t border-gray-700">
                    <span className="text-white font-semibold">
                      {isUpgrade ? "Upgrade cost today" : "Total due today"}
                    </span>
                    <span className="text-white font-semibold">${totalDueToday.toFixed(2)}</span>
                  </div>
                  
                  {billingFrequency === 'annual' && (
                    <div className="text-xs text-gray-400 pt-2">
                      Next payment: ${annualPrice} on {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
              <button className="hover:text-white transition-colors">Help Centre</button>
              <span>$ USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatreonStylePaymentForm(props: PatreonStylePaymentFormProps) {
  return <PaymentFormContent {...props} />;
}
