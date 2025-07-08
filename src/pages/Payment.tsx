
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation } from 'react-router-dom';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { PaymentSuccess } from '@/components/payment/PaymentSuccess';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';

// Use the hardcoded publishable key for now since env vars aren't working in frontend
const stripePromise = loadStripe('pk_test_51RSMPcCli7UywJenyLWbw8lYkr0FV8bEj4A5m5l5RJvznfKfHPXr1pnKE3Q3XcXyV4YdyqK8v3sKjl7FrjrK1bX7B00QQzQtT2z');

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
