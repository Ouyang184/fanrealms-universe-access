import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSubscriptionEventManager } from '@/hooks/useSubscriptionEventManager';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';
import { useAuth } from '@/contexts/AuthContext';

interface UsePaymentProcessingProps {
  clientSecret: string;
  tierId: string;
  creatorId: string;
  tierName: string;
  isUpgrade: boolean;
}

export function usePaymentProcessing({
  clientSecret,
  tierId,
  creatorId,
  tierName,
  isUpgrade
}: UsePaymentProcessingProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { triggerSubscriptionSuccess, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();
  const { clearSubscriptionCache } = useCreateSubscription();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const cleanupIncompleteSubscription = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'incomplete');

      if (clientSecret) {
        await supabase.functions.invoke('stripe-subscriptions', {
          body: { action: 'cancel_payment_intent', clientSecret }
        });
      }

      await invalidateAllSubscriptionQueries();
    } catch {
      // Non-blocking — user can still navigate away
      await invalidateAllSubscriptionQueries().catch(() => {});
    }
  };

  const verifySubscriptionInDB = async (maxRetries = 12, retryDelay = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('tier_id', tierId)
          .eq('creator_id', creatorId)
          .eq('status', 'active');

        if (!error && data && data.length > 0) return true;
      } catch {
        // retry
      }

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    return false;
  };

  const handlePayment = async (stripe: any, elements: any, event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) return;

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || 'Payment could not be processed',
          variant: "destructive"
        });
      } else if (paymentIntent?.status === 'succeeded') {
        setPaymentSucceeded(true);
        setIsVerifying(true);

        clearSubscriptionCache(tierId, creatorId);

        toast({
          title: isUpgrade ? "Upgrade Successful!" : "Payment Successful!",
          description: isUpgrade
            ? `Successfully upgraded to ${tierName}!`
            : `Payment successful! Processing your subscription to ${tierName}...`,
        });

        // Give webhook time to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        const verified = await verifySubscriptionInDB();

        triggerSubscriptionSuccess({ tierId, creatorId, paymentIntentId: paymentIntent.id });
        await invalidateAllSubscriptionQueries();

        toast({
          title: verified
            ? (isUpgrade ? "Upgrade Complete!" : "Subscription Active!")
            : "Payment Processed",
          description: verified
            ? (isUpgrade ? `You've successfully upgraded to ${tierName}` : `You've successfully subscribed to ${tierName}`)
            : "Your payment was successful. Your subscription should be active now.",
        });

        setTimeout(() => navigate('/subscriptions'), verified ? 1500 : 2000);
        setIsVerifying(false);
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    clearSubscriptionCache(tierId, creatorId);
    await cleanupIncompleteSubscription();

    setIsProcessing(false);
    setPaymentSucceeded(false);
    setIsVerifying(false);

    toast({
      title: "Payment Cancelled",
      description: "You can return anytime to complete your subscription.",
    });

    navigate(-1);
  };

  return {
    isProcessing,
    paymentSucceeded,
    isVerifying,
    handlePayment,
    handleCancel
  };
}
