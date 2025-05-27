
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/Layout/MainLayout';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Lock, AlertCircle } from 'lucide-react';

// Get Stripe publishable key from environment variables
const getStripePublishableKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
             window.env?.VITE_STRIPE_PUBLISHABLE_KEY ||
             'pk_test_51RSMPcCli7UywJeny27NOjHOOJpnWXWGIU5zRdZBPQ1rze66AjgyeGqqzwJ22PueDNWuvJojwP85r8YPgAjyTAXB00bY7GCGHL';
  
  console.log('Stripe publishable key check:', {
    fromImportMeta: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    fromWindow: window.env?.VITE_STRIPE_PUBLISHABLE_KEY,
    finalKey: key ? key.substring(0, 20) + '...' : 'NOT FOUND'
  });
  
  return key;
};

// Initialize Stripe
const stripePublishableKey = getStripePublishableKey();
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [elementError, setElementError] = useState<string | null>(null);
  const [paymentDebugInfo, setPaymentDebugInfo] = useState<any>({});
  const location = useLocation();
  const navigate = useNavigate();
  
  const { clientSecret, amount, tierName, tierId, creatorId } = location.state || {};

  // Debug Stripe initialization
  useEffect(() => {
    const debugInfo = {
      stripePromise: !!stripePromise,
      stripe: !!stripe,
      elements: !!elements,
      clientSecret: !!clientSecret,
      publishableKey: stripePublishableKey ? stripePublishableKey.substring(0, 20) + '...' : 'NOT SET',
      locationState: location.state
    };
    
    console.log('Payment: Stripe initialization check:', debugInfo);
    setPaymentDebugInfo(debugInfo);
  }, [stripe, elements, clientSecret, location.state]);

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
    
    const submitDebugInfo = {
      startTime: new Date().toISOString(),
      stripe: !!stripe,
      elements: !!elements,
      clientSecret: !!clientSecret,
      tierId,
      creatorId
    };
    
    console.log('Payment: Starting payment confirmation...', submitDebugInfo);
    setPaymentDebugInfo(prev => ({ ...prev, submission: submitDebugInfo }));

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/creator/${creatorId}`,
        },
        redirect: 'if_required'
      });

      const resultDebugInfo = {
        success: !result.error,
        error: result.error?.message,
        paymentIntent: result.paymentIntent ? {
          id: result.paymentIntent.id,
          status: result.paymentIntent.status
        } : null,
        endTime: new Date().toISOString()
      };
      
      console.log('Payment: Confirmation result:', resultDebugInfo);
      setPaymentDebugInfo(prev => ({ ...prev, result: resultDebugInfo }));

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

        // Dispatch events for UI updates with more details
        const dispatchEvents = () => {
          const eventDetail = { 
            creatorId, 
            tierId, 
            paymentIntent: result.paymentIntent,
            timestamp: new Date().toISOString()
          };
          
          console.log('Payment: Dispatching success events with detail:', eventDetail);
          
          window.dispatchEvent(new CustomEvent('paymentSuccess', {
            detail: eventDetail
          }));
          
          window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
            detail: eventDetail
          }));
        };

        // Dispatch immediately and with delays to ensure all components catch it
        dispatchEvents();
        setTimeout(dispatchEvents, 500);
        setTimeout(dispatchEvents, 2000);
        setTimeout(dispatchEvents, 5000);
        
        // Navigate back to creator page after a brief delay
        setTimeout(() => {
          console.log('Payment: Navigating back to creator page');
          navigate(`/creator/${creatorId}`, { replace: true });
        }, 3000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentDebugInfo(prev => ({ ...prev, error: error instanceof Error ? error.message : String(error) }));
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

  if (!stripePromise) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-4">Stripe Configuration Error</h2>
          <p className="text-muted-foreground mb-6">
            Stripe publishable key is missing. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.
          </p>
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm font-mono">
              Current key: {stripePublishableKey || 'NOT SET'}
            </p>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const monthlyAmount = (amount / 100).toFixed(2);
  const salesTax = (amount * 0.08 / 100).toFixed(2);
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
                    {stripe && elements && clientSecret ? (
                      <PaymentElement 
                        options={{
                          layout: "tabs",
                          paymentMethodOrder: ['card', 'klarna', 'paypal']
                        }}
                        onReady={() => {
                          console.log('PaymentElement ready');
                          setPaymentElementReady(true);
                          setElementError(null);
                        }}
                        onLoadError={(error) => {
                          console.error('PaymentElement load error:', error);
                          setElementError(`Failed to load payment methods: ${error.error?.message || 'Unknown error'}`);
                        }}
                        onChange={(event) => {
                          console.log('PaymentElement change:', event);
                          if (event.complete) {
                            setElementError(null);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <span className="text-sm text-muted-foreground">
                            {!stripe ? 'Initializing Stripe...' : 
                             !elements ? 'Loading Elements...' : 
                             !clientSecret ? 'Missing client secret...' : 
                             'Loading payment methods...'}
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
                    disabled={!stripe || !paymentElementReady || isLoading || !!elementError}
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
                
                {/* Debug info for troubleshooting (development only) */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="text-xs bg-muted p-2 rounded">
                    <summary>Payment Debug Info (Dev Only)</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(paymentDebugInfo, null, 2)}</pre>
                  </details>
                )}
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

  console.log('Payment component rendered:', {
    clientSecret: !!clientSecret,
    stripePromise: !!stripePromise,
    publishableKey: stripePublishableKey ? 'Set' : 'Missing'
  });

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
          <h2 className="text-2xl font-bold mb-4">Stripe Configuration Error</h2>
          <p className="text-muted-foreground mb-6">
            VITE_STRIPE_PUBLISHABLE_KEY is not set in environment variables.
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
