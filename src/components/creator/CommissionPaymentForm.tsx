
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

// Initialize Stripe with a fallback for missing key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef';
const stripePromise = loadStripe(stripePublishableKey);

interface CommissionData {
  id: string;
  title: string;
  description: string;
  agreed_price: number;
  commission_type: {
    name: string;
    description: string;
    custom_addons?: any; // Changed from any[] to any to handle Json type
  };
  creator: {
    display_name: string;
    profile_image_url?: string;
  };
}

interface CommissionPaymentFormProps {
  commission: CommissionData;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ commission, onSuccess, onCancel }: CommissionPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Stripe is properly configured
  const isStripeConfigured = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && 
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isStripeConfigured) {
      setError('Payment system is not properly configured. Please contact support.');
      return;
    }

    if (!stripe || !elements || !confirmed) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment intent on the server
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-commission-payment-intent', {
        body: { 
          commissionId: commission.id,
          amount: commission.agreed_price 
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      // Confirm payment with Stripe
      const { error: confirmError } = await stripe.confirmCardPayment(paymentData.client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      } else {
        toast({ title: "Payment successful!", description: "Your commission payment has been processed." });
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  // Safely handle custom_addons which might be Json type
  const addOns = Array.isArray(commission.commission_type.custom_addons) 
    ? commission.commission_type.custom_addons 
    : [];
  const totalAddOnPrice = addOns.reduce((sum: number, addon: any) => sum + (addon.price || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Show configuration error if Stripe is not set up */}
      {!isStripeConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payment system is not configured. The VITE_STRIPE_PUBLISHABLE_KEY environment variable is missing or invalid.
          </AlertDescription>
        </Alert>
      )}

      {/* Commission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Commission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            {commission.creator.profile_image_url && (
              <img
                src={commission.creator.profile_image_url}
                alt={commission.creator.display_name}
                className="w-12 h-12 rounded-full"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{commission.title}</h3>
              <p className="text-sm text-muted-foreground">by {commission.creator.display_name}</p>
              <p className="text-sm mt-2">{commission.description}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Commission Type</h4>
            <p className="text-sm font-medium">{commission.commission_type.name}</p>
            {commission.commission_type.description && (
              <p className="text-sm text-muted-foreground">{commission.commission_type.description}</p>
            )}
          </div>

          {addOns.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Add-ons</h4>
              <div className="space-y-2">
                {addOns.map((addon: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{addon.name}</span>
                    <span>${addon.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Base Price:</span>
              <span>${commission.agreed_price - totalAddOnPrice}</span>
            </div>
            {totalAddOnPrice > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Add-ons:</span>
                <span>${totalAddOnPrice}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>${commission.agreed_price}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isStripeConfigured ? (
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
          ) : (
            <div className="p-4 border rounded-md bg-gray-50">
              <p className="text-sm text-gray-500">Payment form unavailable - configuration required</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirmation"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              disabled={!isStripeConfigured}
            />
            <label htmlFor="confirmation" className="text-sm">
              I confirm that I want to purchase this commission for ${commission.agreed_price}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={!stripe || !confirmed || isProcessing || !isStripeConfigured}
          className="flex-1"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ${commission.agreed_price}
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function CommissionPaymentForm({ commission, onSuccess, onCancel }: CommissionPaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm commission={commission} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
