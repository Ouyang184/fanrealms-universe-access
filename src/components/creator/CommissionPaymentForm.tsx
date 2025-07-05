import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Clock, User, DollarSign } from 'lucide-react';

// Use TEST Stripe publishable key for commissions
const stripePromise = loadStripe('pk_test_51QSXfpP8KqSCVhQsaEPa7YXm3v7sJ7Ae6HqgE1DdLUe9ePDCZ7i8M0Wj6xZlPjt4uESkzIxKsP2N2hJB8tD9NQKZ00aw1YRqvF');

interface CommissionPaymentFormProps {
  commission: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  commission: any;
  onSuccess: () => void;
  onCancel: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function PaymentFormContent({ commission, onSuccess, onCancel }: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !user) {
      console.error('Stripe not loaded or user not authenticated');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('🔄 Creating payment intent for commission:', commission.id);
      
      // Create payment intent using the edge function
      const { data, error } = await supabase.functions.invoke('create-commission-payment-intent', {
        body: { 
          commissionId: commission.id,
          amount: commission.agreed_price 
        },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('❌ Payment intent creation failed:', error);
        throw new Error(error.message || 'Failed to create payment intent');
      }

      if (!data?.client_secret) {
        console.error('❌ No client secret received:', data);
        throw new Error('Invalid response from payment service');
      }

      console.log('✅ Payment intent created successfully');

      // Confirm the payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              email: user.email,
            },
          },
        }
      );

      if (confirmError) {
        console.error('❌ Payment confirmation failed:', confirmError);
        throw new Error(confirmError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'requires_capture') {
        console.log('✅ Payment authorized successfully - funds held for creator approval');
        toast({
          title: "Payment Authorized! 🎉",
          description: "Your payment has been authorized and funds are held securely. The creator will be notified to review your commission.",
        });
        onSuccess();
      } else {
        console.error('❌ Unexpected payment status:', paymentIntent?.status);
        throw new Error('Payment was not processed correctly');
      }

    } catch (err) {
      console.error('💥 Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            {formatCurrency(commission.agreed_price)}
          </h2>
          <Badge variant="outline">
            {commission.commission_type?.name}
          </Badge>
        </div>

        <div className="text-sm text-muted-foreground">
          <User className="mr-2 inline-block h-4 w-4" />
          {commission.creator?.display_name}
          <Separator orientation="vertical" className="mx-2 h-4" />
          <Clock className="mr-2 inline-block h-4 w-4" />
          Created on {new Date(commission.created_at).toLocaleDateString()}
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Card className="border-2 border-primary/50">
              <CardHeader>
                <CardTitle>Credit Card Information</CardTitle>
              </CardHeader>
              <CardContent>
                <fieldset className="space-y-2">
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
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                    onChange={(e) => {
                      setError(e.error?.message || '');
                    }}
                  />
                </fieldset>
              </CardContent>
            </Card>
            {error && (
              <p className="text-sm text-red-500 mt-2">
                <AlertCircle className="mr-2 inline-block h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={onCancel}>
              Back
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || !stripe || !elements}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { AlertCircle } from 'lucide-react';

export function CommissionPaymentForm(props: CommissionPaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
}
