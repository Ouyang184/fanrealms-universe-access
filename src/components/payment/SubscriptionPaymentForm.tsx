
import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPaymentFormProps {
  tierName?: string;
  subscriptionId?: string;
  isUpgrade?: boolean;
}

export function SubscriptionPaymentForm({ 
  tierName, 
  subscriptionId, 
  isUpgrade 
}: SubscriptionPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "There was an error processing your payment.",
          variant: "destructive"
        });
      } else {
        // Payment succeeded
        toast({
          title: "Payment Successful!",
          description: `You have successfully subscribed to ${tierName || 'the subscription'}.`,
        });
        
        // Trigger subscription success event
        window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
          detail: { subscriptionId, tierName }
        }));
        
        navigate('/subscriptions');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            {isUpgrade ? 'Upgrade' : 'Subscribe to'} {tierName || 'Premium'}
          </CardTitle>
          <p className="text-muted-foreground">
            Complete your payment to {isUpgrade ? 'upgrade your subscription' : 'start your subscription'}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <PaymentElement />
            </div>
            
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mr-2" />
              Secured by Stripe
            </div>
            
            <div className="space-y-3">
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
                  `Complete ${isUpgrade ? 'Upgrade' : 'Subscription'}`
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="w-full"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
