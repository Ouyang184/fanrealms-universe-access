
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/Layout/MainLayout';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Lock, AlertCircle } from 'lucide-react';

// Initialize Stripe with proper error handling
const getStripePromise = () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('Stripe publishable key is not set in environment variables');
    return null;
  }
  
  console.log('Initializing Stripe with key:', publishableKey.substring(0, 20) + '...');
  return loadStripe(publishableKey);
};

const stripePromise = getStripePromise();

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { clientSecret, amount, tierName, tierId, creatorId } = location.state || {};

  // Check Stripe initialization
  useEffect(() => {
    if (!stripePromise) {
      setStripeError('Stripe is not properly configured. Please check the publishable key.');
      return;
    }

    const checkStripeReady = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!stripeInstance) {
          setStripeError('Failed to initialize Stripe. Please refresh the page.');
        }
      } catch (error) {
        console.error('Stripe initialization error:', error);
        setStripeError('Error initializing payment system. Please try again.');
      }
    };

    checkStripeReady();
  }, []);

  // Handle PaymentElement ready state
  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }
    
    try {
      const paymentElement = elements.getElement(PaymentElement);
      if (paymentElement) {
        console.log('PaymentElement is ready');
        setPaymentElementReady(true);
      }
    } catch (error) {
      console.error('Error checking PaymentElement:', error);
      setStripeError('Error loading payment methods. Please refresh the page.');
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment system not ready",
        description: "Please wait for the payment system to load.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting payment confirmation...');
      
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/creator/${creatorId}`,
        },
        redirect: 'if_required'
      });

      if (result.error) {
        console.error('Payment error:', result.error);
        toast({
          title: "Payment failed",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        console.log('Payment successful!', result.paymentIntent);
        
        toast({
          title: "Payment successful!",
          description: `You've successfully subscribed to ${tierName}`,
        });

        // Give some time for webhooks to process
        setTimeout(() => {
          // Dispatch events for UI updates
          window.dispatchEvent(new CustomEvent('paymentSuccess', {
            detail: { creatorId, tierId, paymentIntent: result.paymentIntent }
          }));
          
          window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
            detail: { creatorId, tierId }
          }));
          
          // Navigate back to creator page
          navigate(`/creator/${creatorId}`, { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientSecret || !amount || !tierName) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Payment Session</h2>
          <p className="text-muted-foreground mb-6">
            The payment session is invalid or has expired.
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (stripeError) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-4">Payment System Error</h2>
          <p className="text-muted-foreground mb-6">{stripeError}</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const monthlyAmount = (amount / 100).toFixed(2);
  const salesTax = (amount * 0.08 / 100).toFixed(2); // 8% tax
  const totalAmount = (amount * 1.08 / 100).toFixed(2);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-10">
        <div className="mb-6">
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Details - Left Side */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Payment details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Amount */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Payment amount</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pay the set price or you can choose to pay more.
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="bg-muted p-3 rounded-md">
                        <span className="text-sm text-muted-foreground">Monthly payment</span>
                        <div className="font-medium">${monthlyAmount}/month</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">$</span>
                      <input 
                        type="number" 
                        value={monthlyAmount} 
                        readOnly
                        className="w-20 p-2 border rounded text-right bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment method</h3>
                  <div className="border rounded-lg p-6 bg-white min-h-[200px]">
                    {stripe && elements && !stripeError ? (
                      <PaymentElement 
                        options={{
                          layout: "tabs",
                          paymentMethodOrder: ['card', 'klarna', 'paypal'],
                          fields: {
                            billingDetails: {
                              address: {
                                country: 'never'
                              }
                            }
                          }
                        }}
                        onReady={() => {
                          console.log('PaymentElement onReady triggered');
                          setPaymentElementReady(true);
                        }}
                        onLoadError={(error) => {
                          console.error('PaymentElement load error:', error);
                          setStripeError('Failed to load payment methods. Please refresh the page.');
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">
                            {stripeError ? 'Error loading payment methods' : 'Loading payment methods...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <div className="text-xs text-muted-foreground">
                  <p>
                    You'll pay ${totalAmount} today, and then ${monthlyAmount} monthly on the 1st. Your next charge will be on 1 June.
                  </p>
                  <p className="mt-2">
                    By clicking Subscribe now, you agree to our Terms of Use and Privacy Policy. 
                    This subscription automatically renews monthly, and you'll be notified in advance if the 
                    monthly amount increases. Cancel at any time in your membership settings.
                  </p>
                </div>

                {/* Subscribe Button */}
                <form onSubmit={handleSubmit}>
                  <Button 
                    type="submit" 
                    disabled={!stripe || !paymentElementReady || isLoading || stripeError !== null}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Subscribe now
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Right Side */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Order summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Creator Info */}
                <div className="flex items-center space-x-3 pb-4 border-b">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {tierName?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">Creator Subscription</div>
                    <div className="text-sm text-muted-foreground">{tierName}</div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly payment</span>
                    <span>${monthlyAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>One-time credit</span>
                    <span>-$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Tax</span>
                    <span>${salesTax}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total due today</span>
                    <span>${totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function Payment() {
  const location = useLocation();
  const { clientSecret } = location.state || {};

  if (!clientSecret) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Payment Session Required</h2>
          <p className="text-muted-foreground mb-6">
            Please start the subscription process from a creator's page.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!stripePromise) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-4">Configuration Error</h2>
          <p className="text-muted-foreground mb-6">
            Stripe is not properly configured. Please contact support.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#000000',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
