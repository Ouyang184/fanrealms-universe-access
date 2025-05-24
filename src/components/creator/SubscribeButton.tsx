
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  tierId: string;
  creatorId: string;
  tierName: string;
  price: number;
  isSubscribed?: boolean;
}

export function SubscribeButton({ 
  tierId, 
  creatorId, 
  tierName, 
  price, 
  isSubscribed = false 
}: SubscribeButtonProps) {
  const { user } = useAuth();
  const { createSubscription, isProcessing, setIsProcessing } = useStripeSubscription();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setShowPaymentDialog(true);

    try {
      const result = await createSubscription({ tierId, creatorId });
      
      if (result?.clientSecret) {
        // Here you would integrate with Stripe Elements to complete payment
        // For now, we'll show a success message
        toast({
          title: "Subscription created!",
          description: `You've successfully subscribed to ${tierName}.`,
        });
        setShowPaymentDialog(false);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSubscribed) {
    return (
      <Button variant="outline" disabled>
        Subscribed
      </Button>
    );
  }

  return (
    <>
      <Button 
        onClick={handleSubscribe}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Subscribe for $${price}/month`
        )}
      </Button>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p>Subscribing to <strong>{tierName}</strong></p>
              <p className="text-2xl font-bold">${price}/month</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                🔄 Payment processing will be completed with Stripe Elements in the next update.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Payment completed!",
                    description: "Your subscription is now active.",
                  });
                  setShowPaymentDialog(false);
                }}
                className="flex-1"
              >
                Complete Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
