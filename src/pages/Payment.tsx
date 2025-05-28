import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/Layout/MainLayout';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Get Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RSMPcCli7UywJeny27NOjHOOJpnWXWGIU5zRdZBPQ1rze66AjgyeGqqzwJ22PueDNWuvJojwP85r8YPgAjyTAXB00bY7GCGHL');

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
      toast({
        title: "Payment system not ready",
        description: "Please wait for the payment system to load.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Processing payment for subscription');
      
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
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded, activating subscription');
        
        // Activate the subscription in our database
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          })
          .eq('stripe_subscription_id', result.paymentIntent.id);

        if (updateError) {
          console.error('Error updating subscription status:', updateError);
        } else {
          console.log('Subscription activated successfully');
        }

        toast({
          title: "Payment successful!",
          description: `You've successfully subscribed to ${tierName}`,
        });

        // Dispatch success events
        const eventDetail = { creatorId, tierId, tierName, paymentIntent: result.paymentIntent };
        window.dispatchEvent(new CustomEvent('paymentSuccess', { detail: eventDetail }));
        window.dispatchEvent(new CustomEvent('subscriptionSuccess', { detail: eventDetail }));
        
        setTimeout(() => {
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

  const monthlyAmount = (amount / 100).toFixed(2);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-10">
        <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Subscription</CardTitle>
            <CardDescription>
              Subscribe to {tierName} for ${monthlyAmount}/month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg p-6">
              <PaymentElement />
            </div>

            <form onSubmit={handleSubmit}>
              <Button 
                type="submit" 
                disabled={!stripe || isLoading}
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
                    Subscribe for ${monthlyAmount}/month
                  </>
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

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#000000',
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
