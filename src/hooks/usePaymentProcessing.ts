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
    if (!user?.id) {
      console.warn('===== CLEANUP SKIPPED: No user ID =====');
      return;
    }

    console.log('===== CLEANING UP INCOMPLETE SUBSCRIPTION =====');
    console.log('Cleanup details:', { 
      userId: user.id, 
      tierId, 
      creatorId, 
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length 
    });

    let dbCleanupSuccess = false;
    let stripeCleanupSuccess = false;

    try {
      // Step 1: Always try to delete incomplete subscription records first
      console.log('🗑️ Step 1: Cleaning up database records...');
      const { data: deletedSubscriptions, error: deleteError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('creator_id', creatorId)
        .eq('tier_id', tierId)
        .eq('status', 'incomplete')
        .select();

      if (deleteError) {
        console.error('❌ Database cleanup failed:', deleteError);
      } else {
        dbCleanupSuccess = true;
        if (deletedSubscriptions && deletedSubscriptions.length > 0) {
          console.log('✅ Deleted incomplete subscriptions:', deletedSubscriptions.length);
        } else {
          console.log('ℹ️ No incomplete subscriptions found to delete');
        }
      }

      // Step 2: Try to cancel Stripe payment intent (but don't let failure block cleanup)
      if (clientSecret) {
        console.log('💳 Step 2: Attempting to cancel Stripe payment intent...');
        console.log('Client secret format check:', {
          hasSecret: !!clientSecret,
          startsWithPi: clientSecret.startsWith('pi_'),
          includesSecret: clientSecret.includes('_secret_'),
          length: clientSecret.length
        });

        try {
          const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
            body: {
              action: 'cancel_payment_intent',
              clientSecret: clientSecret
            }
          });

          if (error) {
            console.error('❌ Stripe cancellation API error:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
          } else {
            stripeCleanupSuccess = true;
            console.log('✅ Successfully cancelled payment intent:', data);
          }
        } catch (error) {
          console.error('❌ Stripe cancellation network error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : 'No stack'
          });
        }
      } else {
        console.log('ℹ️ Step 2: No client secret provided, skipping Stripe cancellation');
      }

      // Step 3: Always invalidate queries regardless of API failures
      console.log('🔄 Step 3: Refreshing subscription data...');
      await invalidateAllSubscriptionQueries();
      
      console.log('===== CLEANUP SUMMARY =====');
      console.log({
        dbCleanupSuccess,
        stripeCleanupSuccess,
        overallSuccess: dbCleanupSuccess || stripeCleanupSuccess
      });
      
    } catch (error) {
      console.error('===== CRITICAL CLEANUP ERROR =====');
      console.error('Unexpected error during cleanup:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      
      // Still try to invalidate queries even if everything else failed
      try {
        await invalidateAllSubscriptionQueries();
        console.log('✅ At least managed to refresh subscription data');
      } catch (refreshError) {
        console.error('❌ Even refresh failed:', refreshError);
      }
    }
  };

  const verifySubscriptionInDB = async (maxRetries = 12, retryDelay = 2000) => {
    console.log('===== STARTING SUBSCRIPTION VERIFICATION =====');
    console.log('Looking for subscription with:', { tierId, creatorId });
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`===== VERIFICATION ATTEMPT ${i + 1}/${maxRetries} =====`);
        
        // Check specifically for our subscription in user_subscriptions table
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
      console.log('Confirming subscription payment with client secret:', clientSecret);

      // Use confirmPayment for subscription payments instead of confirmCardPayment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
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
        
        const successMessage = isUpgrade 
          ? `Successfully upgraded to ${tierName}!`
          : `Payment successful! Processing your subscription to ${tierName}...`;
        
        toast({
          title: isUpgrade ? "Upgrade Successful!" : "Payment Successful!",
          description: successMessage,
        });

        console.log('Waiting for webhook processing...');
        // Give webhook more time to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        const verified = await verifySubscriptionInDB();
        
        if (verified) {
          console.log('Subscription verified in database');
          
          triggerSubscriptionSuccess({
            tierId,
            creatorId,
            paymentIntentId: paymentIntent.id
          });
          
          await invalidateAllSubscriptionQueries();
          
          toast({
            title: isUpgrade ? "Upgrade Complete!" : "Subscription Active!",
            description: isUpgrade 
              ? `You've successfully upgraded to ${tierName}`
              : `You've successfully subscribed to ${tierName}`,
          });

          setTimeout(() => {
            navigate('/subscriptions');
          }, 1500);
        } else {
          console.warn('Payment succeeded but subscription not found in database - forcing refresh');
          
          // Force a refresh of subscription data
          await invalidateAllSubscriptionQueries();
          
          triggerSubscriptionSuccess({
            tierId,
            creatorId,
            paymentIntentId: paymentIntent.id
          });
          
          toast({
            title: "Payment Processed",
            description: "Your payment was successful. Your subscription should be active now. Redirecting to subscriptions page.",
          });

          setTimeout(() => {
            navigate('/subscriptions');
          }, 2000);
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

  const handleCancel = async () => {
    console.log('User cancelled payment, navigating back');
    
    // Clear the cache when user cancels
    clearSubscriptionCache(tierId, creatorId);
    
    // Clean up any incomplete subscription records
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
