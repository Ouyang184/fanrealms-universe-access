
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation } from 'react-router-dom';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { PaymentSuccess } from '@/components/payment/PaymentSuccess';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';

// Use live publishable key for subscription payments
const stripePromise = loadStripe('pk_live_51RSMPcCli7UywJenKnYQOCg0GW8YrW9nRY3vfMf0TYZyVV8eLPFEz6QzZFN7W2D8MMGtVHEFxOC6XgKYRhJ8lJjl00yjqfyF1L');

export default function Payment() {
  const location = useLocation();
  const { 
    clientSecret, 
    tierName, 
    tierId, 
    creatorId, 
    isUpgrade 
  } = location.state || {};

  const {
    paymentSucceeded,
    isVerifying
  } = usePaymentProcessing({
    clientSecret: clientSecret || '',
    tierId: tierId || '',
    creatorId: creatorId || '',
    tierName: tierName || '',
    isUpgrade: isUpgrade || false
  });

  // Add debugging to check for client secret
  console.log('Payment page state:', {
    clientSecret: clientSecret ? 'Present' : 'Missing',
    tierName,
    tierId,
    creatorId,
    isUpgrade
  });

  if (paymentSucceeded) {
    return (
      <PaymentSuccess
        isUpgrade={isUpgrade}
        tierName={tierName}
        isVerifying={isVerifying}
      />
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Error</h1>
          <p className="text-gray-400">No payment information found. Please try subscribing again.</p>
          <p className="text-gray-500 text-sm mt-2">Debug: Client secret missing from navigation state</p>
        </div>
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#ffffff',
            colorText: '#ffffff',
            colorTextSecondary: '#9ca3af',
            borderRadius: '8px',
            colorBackground: '#1f2937',
            colorDanger: '#ef4444',
          }
        }
      }}
    >
      <PaymentForm />
    </Elements>
  );
}
