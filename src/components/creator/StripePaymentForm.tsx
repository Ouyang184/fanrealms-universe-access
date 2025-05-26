
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Load Stripe (you'll need to add your publishable key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  tierName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PaymentForm({ clientSecret, amount, tierName, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment successful!",
          description: `You've successfully subscribed to ${tierName}.`,
        });
        onSuccess();
      }
    } catch (err) {
      onError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: 'transparent',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Payment Details</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <Shield className="h-4 w-4 mr-1" />
            Secured by Stripe
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center mb-3">
            <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
            <label className="text-sm font-medium">Card Information</label>
          </div>
          <div className="stripe-card-element">
            <CardElement options={cardElementOptions} />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Subscribing to:</span>
          <span>{tierName}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-medium">Monthly charge:</span>
          <span className="text-lg font-bold">${(amount / 100).toFixed(2)}</span>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Complete Payment - $${(amount / 100).toFixed(2)}/month`
        )}
      </Button>
    </form>
  );
}

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  tierName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function StripePaymentForm({ clientSecret, amount, tierName, onSuccess, onError }: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm
            clientSecret={clientSecret}
            amount={amount}
            tierName={tierName}
            onSuccess={onSuccess}
            onError={onError}
          />
        </CardContent>
      </Card>
    </Elements>
  );
}
