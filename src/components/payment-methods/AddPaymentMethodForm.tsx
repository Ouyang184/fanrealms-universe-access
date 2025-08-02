import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddPaymentMethodFormProps {
  onSuccess: () => void;
  createSetupIntent: () => Promise<string>;
  isCreatingSetupIntent: boolean;
}

export function AddPaymentMethodForm({ 
  onSuccess, 
  createSetupIntent, 
  isCreatingSetupIntent 
}: AddPaymentMethodFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create setup intent
      const clientSecret = await createSetupIntent();

      // Confirm the setup intent
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent?.status === 'succeeded') {
        toast({
          title: "Success",
          description: "Payment method added successfully",
        });
        onSuccess();
      }
    } catch (err: any) {
      console.error('Add payment method error:', err);
      setError(err.message || 'Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 border rounded-md">
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
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!stripe || isProcessing || isCreatingSetupIntent}
            className="w-full"
          >
            {(isProcessing || isCreatingSetupIntent) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Payment Method...
              </>
            ) : (
              'Add Payment Method'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}