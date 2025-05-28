
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe('pk_test_51RSMPcCli7UywJeny27NOjHOOJpnWXWGIU5zRdZBPQ1rze66AjgyeGqqzwJ22PueDNWuvJojwP85r8YPgAjyTAXB00bY7GCGHL');

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { clientSecret, amount, tierName, tierId, creatorId } = location.state || {};

  useEffect(() => {
    if (!clientSecret) {
      toast({
        title: "Payment Error",
        description: "No payment information found. Please try subscribing again.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [clientSecret, navigate, toast]);

  const verifySubscriptionStatus = async (paymentIntentId: string, maxRetries = 5) => {
    console.log('Verifying subscription status for payment:', paymentIntentId);
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
          body: {
            action: 'update_subscription_status',
            paymentIntentId,
            tierId,
            creatorId
          }
        });

        if (!error && data?.success) {
          console.log('Subscription status verified successfully');
          return true;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error verifying subscription status:', error);
      }
    }
    
    return false;
  };

  const refreshAllData = async () => {
    console.log('Refreshing all subscription data...');
    
    // Invalidate all subscription-related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['subscription-check'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-creator-subscribers'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-user-subscriptions'] }),
      queryClient.invalidateQueries({ queryKey: ['simple-subscription-check'] }),
      queryClient.refetchQueries({ queryKey: ['user-subscriptions'] }),
      queryClient.refetchQueries({ queryKey: ['subscription-check', undefined, tierId, creatorId] })
    ]);
    
    console.log('All subscription data refreshed');
  };

  const handlePayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Confirming payment with client secret:', clientSecret);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        toast({
          title: "Payment Failed",
          description: error.message || 'Payment could not be processed',
          variant: "destructive"
        });
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        setPaymentSucceeded(true);
        setIsVerifying(true);
        
        toast({
          title: "Payment Successful!",
          description: `Processing your subscription to ${tierName}...`,
        });

        // Wait for webhook processing and verify subscription status
        const verified = await verifySubscriptionStatus(paymentIntent.id);
        
        if (verified) {
          // Refresh all subscription-related data
          await refreshAllData();
          
          // Dispatch success events
          window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
            detail: { tierId, creatorId, paymentIntentId: paymentIntent.id }
          }));
          
          window.dispatchEvent(new CustomEvent('paymentSuccess', {
            detail: { tierId, creatorId, paymentIntentId: paymentIntent.id }
          }));

          toast({
            title: "Subscription Active!",
            description: `You've successfully subscribed to ${tierName}`,
          });
        }
        
        setIsVerifying(false);
        
        // Redirect after a longer delay to ensure data is refreshed
        setTimeout(() => {
          navigate('/subscriptions');
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSucceeded) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-muted-foreground">Processing your subscription...</p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You've successfully subscribed to {tierName}. Redirecting to your subscriptions...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading payment information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Subscription</CardTitle>
          <p className="text-sm text-muted-foreground">
            Subscribe to {tierName} for ${(amount / 100).toFixed(2)}/month
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="p-4 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!stripe || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay $${(amount / 100).toFixed(2)}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Payment() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
