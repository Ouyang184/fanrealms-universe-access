
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, Shield, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Use live publishable key for subscription payments
const stripePromise = loadStripe('pk_live_51RSMPcCli7UywJenKnYQOCg0GW8YrW9nRY3vfMf0TYZyVV8eLPFEz6QzZFN7W2D8MMGtVHEFxOC6XgKYRhJ8lJjl00yjqfyF1L');

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
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Input */}
      <Card className="border border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">•••• •••• •••• ••••</span>
            </div>
            <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-xs text-white font-bold">VISA</span>
            </div>
          </div>
          <div className="stripe-card-element">
            <CardElement options={cardElementOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Add New Payment Method */}
      <button
        type="button"
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Add new payment method</span>
      </button>

      {/* Subscribe Button */}
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full bg-white text-black hover:bg-gray-100 border border-gray-300"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Subscribe now
          </>
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
      <PaymentForm
        clientSecret={clientSecret}
        amount={amount}
        tierName={tierName}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
