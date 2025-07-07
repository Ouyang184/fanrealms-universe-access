
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';

interface StripePaymentFormProps {
  commissionId: string;
  amount: number;
  title: string;
  creatorName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StripePaymentForm({
  commissionId,
  amount,
  title,
  creatorName,
  onSuccess,
  onCancel
}: StripePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      console.log('Creating commission payment for:', {
        commissionId,
        amount,
        title
      });

      const { data, error } = await supabase.functions.invoke('create-commission-payment', {
        body: { commissionId }
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (!data?.url) {
        throw new Error('No payment URL received');
      }

      console.log('Payment session created, redirecting to:', data.url);

      // Redirect in the same window instead of opening new tab
      window.location.href = data.url;

    } catch (error) {
      console.error('Error creating payment:', error);
      setIsProcessing(false);
      
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to start payment process. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Commission Payment
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

        <div className="pt-4 space-y-2">
          <Button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
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

        <p className="text-xs text-muted-foreground text-center">
          You'll be redirected to Stripe's secure payment page to complete your payment.
        </p>
      </CardContent>
    </Card>
  );
}
