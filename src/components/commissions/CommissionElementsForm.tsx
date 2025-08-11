import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';

interface Props {
  requestId: string;
  amount: number;
}

export default function CommissionElementsForm({ requestId, amount }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/commissions/${requestId}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      console.error('Stripe confirmation error:', error);
      setIsProcessing(false);
      return;
    }

    if (paymentIntent) {
      if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded') {
        navigate(`/commissions/${requestId}/payment-success`);
        return;
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-md p-3">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Authorizing...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-5 w-5" />
            Authorize ${amount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}
