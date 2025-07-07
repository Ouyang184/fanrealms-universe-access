
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
  setupIntentId?: string;
}

export function usePaymentProcessing({
  clientSecret,
  tierId,
  creatorId,
  tierName,
  isUpgrade,
  setupIntentId
}: UsePaymentProcessingProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { triggerSubscriptionSuccess, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();
  const { clearSubscriptionCache } = useCreateSubscription();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifySubscriptionInDB = async (maxRetries = 10, retryDelay = 1500) => {
    console.log('Verifying subscription in database...');
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Verification attempt ${i + 1}/${maxRetries}`);
        
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('tier_id', tierId)
          .eq('creator_id', creatorId)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('DB verification error:', error);
        } else if (data) {
          console.log('Subscription found in user_subscriptions table:', data);
          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } catch (error) {
        console.error('Error verifying subscription in DB:', error);
      }
    }
    
    console.log('Subscription not found in database after all retries');
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

      console.log('Confirming setup intent with client secret:', clientSecret);

      // Use confirmSetupIntent instead of confirmCardPayment for subscriptions
      const { error, setupIntent } = await stripe.confirmSetupIntent(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('Setup intent failed:', error);
        toast({
          title: "Payment Failed",
          description: error.message || 'Payment method could not be saved',
          variant: "destructive"
        });
      } else if (setupIntent?.status === 'succeeded') {
        console.log('Setup intent succeeded:', setupIntent.id);
        
        // Clear the cache since setup succeeded
        clearSubscriptionCache(tierId, creatorId);
        
        toast({
          title: "Payment Method Saved!",
          description: "Creating your subscription...",
        });

        // Now complete the subscription using the setup intent
        console.log('Completing subscription with setup intent:', setupIntent.id);
        
        const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('stripe-subscriptions', {
          body: {
            action: 'complete_subscription',
            setupIntentId: setupIntent.id
          }
        });

        if (subscriptionError || subscriptionData?.error) {
          console.error('Subscription completion failed:', subscriptionError || subscriptionData?.error);
          toast({
            title: "Subscription Error",
            description: subscriptionData?.error || subscriptionError?.message || 'Failed to create subscription',
            variant: "destructive"
          });
        } else {
          console.log('Subscription created successfully:', subscriptionData);
          setPaymentSucceeded(true);
          setIsVerifying(true);
          
          const successMessage = isUpgrade 
            ? `Successfully upgraded to ${tierName}!`
            : `Subscription to ${tierName} created successfully!`;
          
          toast({
            title: isUpgrade ? "Upgrade Complete!" : "Subscription Created!",
            description: successMessage,
          });

          console.log('Waiting for webhook processing...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          const verified = await verifySubscriptionInDB();
          
          if (verified) {
            console.log('Subscription verified in database');
            
            triggerSubscriptionSuccess({
              tierId,
              creatorId,
              paymentIntentId: subscriptionData.subscriptionId
            });
            
            await invalidateAllSubscriptionQueries();
            
            toast({
              title: isUpgrade ? "Upgrade Active!" : "Subscription Active!",
              description: isUpgrade 
                ? `You've successfully upgraded to ${tierName}`
                : `You've successfully subscribed to ${tierName}`,
            });

            setTimeout(() => {
              navigate('/subscriptions');
            }, 1500);
          } else {
            console.warn('Subscription created but not found in database yet');
            
            triggerSubscriptionSuccess({
              tierId,
              creatorId,
              paymentIntentId: subscriptionData.subscriptionId
            });
            
            await invalidateAllSubscriptionQueries();
            
            toast({
              title: "Subscription Created",
              description: "Your subscription was created successfully. It should be active shortly. Please check your subscriptions page.",
            });

            setTimeout(() => {
              navigate('/subscriptions');
            }, 2000);
          }
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
