
import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface EmbeddedCommissionPaymentProps {
  commissionId: string;
  amount: number;
  title: string;
  creatorName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmbeddedCommissionPayment({
  commissionId,
  amount,
  title,
  creatorName,
  onSuccess,
  onCancel
}: EmbeddedCommissionPaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, [commissionId]);

  const createPaymentIntent = async () => {
    try {
      console.log('Creating payment intent for commission:', commissionId);

      const { data, error } = await supabase.functions.invoke('create-commission-payment-intent', {
        body: { commissionId, amount }
      });

      if (error) {
        console.error('Payment intent creation error:', error);
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (!data?.client_secret) {
        throw new Error('No client secret received');
      }

      setClientSecret(data.client_secret);
      console.log('Payment intent created successfully');
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Payment Setup Error",
        description: error instanceof Error ? error.message : "Failed to setup payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      setPaymentStatus('failed');
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Commission Payment',
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        setPaymentStatus('failed');
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed. Please try again.",
          variant: "destructive"
        });
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        setPaymentStatus('succeeded');
        toast({
          title: "Payment Successful!",
          description: "Your commission payment has been processed successfully.",
        });
        
        // Call success callback after a brief delay
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  if (paymentStatus === 'succeeded') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
          <p className="text-muted-foreground mb-4">
            Your commission payment has been processed successfully.
          </p>
          <p className="text-sm text-muted-foreground">
            The creator has been notified and will review your request.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Commission:</span>
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Creator:</span>
            <span className="text-sm font-medium">{creatorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="text-lg font-bold">${amount}</span>
          </div>
        </div>

        {clientSecret ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Card Details</label>
              <div className="border rounded-md p-3 bg-background">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                onClick={handlePayment}
                disabled={!stripe || isProcessing || paymentStatus === 'processing'}
                className="w-full"
                size="lg"
              >
                {isProcessing || paymentStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ${amount}
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  disabled={isProcessing}
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>

            {paymentStatus === 'failed' && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                Payment failed. Please check your card details and try again.
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Setting up payment...</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Your payment is secure and encrypted. Card details are handled by Stripe.
        </p>
      </CardContent>
    </Card>
  );
}
