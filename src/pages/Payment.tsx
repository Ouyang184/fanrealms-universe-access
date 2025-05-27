
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/Layout/MainLayout';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { clientSecret, amount, tierName, tierId, creatorId } = location.state || {};

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
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
        
        // Dispatch immediate success events
        window.dispatchEvent(new CustomEvent('paymentSuccess', {
          detail: { creatorId, tierId, paymentIntent: result.paymentIntent }
        }));
        
        window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
          detail: { creatorId, tierId }
        }));
        
        toast({
          title: "Payment successful!",
          description: `You've successfully subscribed to ${tierName}`,
        });

        // Wait a moment for events to propagate, then navigate
        setTimeout(() => {
          navigate(`/creator/${creatorId}`, { replace: true });
        }, 1000);
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
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
            <CardDescription>
              Subscribing to {tierName} for ${(amount / 100).toFixed(2)}/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <PaymentElement />
              <Button 
                type="submit" 
                disabled={!stripe || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Subscribe for $${(amount / 100).toFixed(2)}/month`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
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
          <p className="text-muted-foreground">
            Please start the subscription process from a creator's page.
          </p>
        </div>
      </MainLayout>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
