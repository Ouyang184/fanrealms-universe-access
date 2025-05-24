
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { StripePaymentForm } from './StripePaymentForm';

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
  const [clientSecret, setClientSecret] = useState<string | null>(null);

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

    try {
      const result = await createSubscription({ tierId, creatorId });
      
      if (result?.clientSecret) {
        setClientSecret(result.clientSecret);
        setShowPaymentDialog(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setClientSecret(null);
    toast({
      title: "Subscription activated!",
      description: `Welcome to ${tierName}! Your subscription is now active.`,
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive"
    });
  };

  const handleDialogClose = () => {
    setShowPaymentDialog(false);
    setClientSecret(null);
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

      <Dialog open={showPaymentDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
          </DialogHeader>
          
          {clientSecret ? (
            <StripePaymentForm
              clientSecret={clientSecret}
              amount={price * 100} // Convert to cents
              tierName={tierName}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
