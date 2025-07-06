
import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

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
  const stripe = useStripe();
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }

    // Check if payment was already completed via URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntentStatus = urlParams.get('payment_intent_status');
    
    if (paymentIntentStatus === 'succeeded') {
      setPaymentSucceeded(true);
      setIsVerifying(false);
      
      // Trigger subscription success event
      window.dispatchEvent(new CustomEvent('subscriptionSuccess', {
        detail: { tierId, creatorId, tierName, isUpgrade }
      }));
    }
  }, [stripe, clientSecret, tierId, creatorId, tierName, isUpgrade]);

  return {
    paymentSucceeded,
    isVerifying
  };
}
