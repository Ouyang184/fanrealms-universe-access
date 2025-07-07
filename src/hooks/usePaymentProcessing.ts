
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSubscriptionEventManager } from '@/hooks/useSubscriptionEventManager';
import { useCreateSubscription } from '@/hooks/stripe/useCreateSubscription';

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
  const queryClient = useQueryClient();
  const { triggerSubscriptionSuccess, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();
  const { clearSubscriptionCache } = useCreateSubscription();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifySubscriptionInDB = async (maxRetries = 12, retryDelay = 2000) => {
    console.log('===== STARTING SUBSCRIPTION VERIFICATION =====');
    console.log('Looking for subscription with:', { tierId, creatorId });
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`===== VERIFICATION ATTEMPT ${i + 1}/${maxRetries} =====`);
        
        // Check specifically for our subscription
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('tier_id', tierId)
          .eq('creator_id', creatorId)
          .eq('status', 'active');

        console.log('Query for specific subscription returned:', { data, error });
        console.log('Number of matching subscriptions:', data?.length || 0);

        if (error) {
          console.error('===== DB VERIFICATION ERROR =====');
          console.error('Error details:', JSON.stringify(error, null, 2));
        } else if (data && data.length > 0) {
          console.log('===== SUBSCRIPTION FOUND IN DATABASE =====');
          console.log('Found subscription:', JSON.stringify(data[0], null, 2));
          return true;
        } else {
          console.log('===== NO MATCHING SUBSCRIPTION FOUND =====');
          console.log(`No active subscription found for tier_id: ${tierId}, creator_id: ${creatorId}`);
        }
        
        if (i < maxRetries - 1) {
          console.log(`Waiting ${retryDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.error('===== VERIFICATION ATTEMPT ERROR =====');
        console.error('Error during verification attempt:', error);
      }
    }
    
    console.log('===== SUBSCRIPTION VERIFICATION FAILED =====');
    console.log(`Subscription not found in database after ${maxRetries} retries`);
    return false;
  };

  const handlePayment = async (stripe: any, elements: any, event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement('card');
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Confirming payment with client secret:', clientSecret);

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        toast({
          title: "Payment Failed",
          description: error.message || 'Payment could not be processed',
          variant: "destructive"
        });
      } else if (paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        setPaymentSucceeded(true);
        setIsVerifying(true);
        
        // Clear the cache since payment succeeded
        clearSubscriptionCache(tierId, creatorId);
        
        // Show immediate success notification
        toast({
          title: "🎉 Payment Successful!",
          description: isUpgrade 
            ? `Payment confirmed! Processing your upgrade to ${tierName}...`
            : `Payment confirmed! Activating your subscription to ${tierName}...`,
          duration: 4000,
        });

        console.log('Waiting for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        const verified = await verifySubscriptionInDB();
        
        if (verified) {
          console.log('Subscription verified in database');
          
          // Show success notification
          toast({
            title: "✅ Subscription Activated!",
            description: isUpgrade 
              ? `Successfully upgraded to ${tierName}! Your new benefits are now active.`
              : `Successfully subscribed to ${tierName}! Welcome aboard!`,
            duration: 6000,
          });
          
          triggerSubscriptionSuccess({
            tierId,
            creatorId,
            paymentIntentId: paymentIntent.id
          });
          
          await invalidateAllSubscriptionQueries();

          setTimeout(() => {
            navigate('/subscriptions');
          }, 2000);
        } else {
          console.warn('Payment succeeded but subscription not found in database');
          
          // Still show success but with note about delay
          toast({
            title: "💳 Payment Processed",
            description: "Your payment was successful! Your subscription should be active shortly. Please check your subscriptions page.",
            duration: 8000,
          });
          
          triggerSubscriptionSuccess({
            tierId,
            creatorId,
            paymentIntentId: paymentIntent.id
          });
          
          await invalidateAllSubscriptionQueries();

          setTimeout(() => {
            navigate('/subscriptions');
          }, 3000);
        }
        
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    console.log('User cancelled payment, navigating back');
    
    // Clear the cache when user cancels
    clearSubscriptionCache(tierId, creatorId);
    
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
