
import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaymentSuccess } from '@/components/payment/PaymentSuccess';
import { usePaymentProcessing } from '@/hooks/usePaymentProcessing';
import { SubscriptionPaymentForm } from '@/components/payment/SubscriptionPaymentForm';

// Use the environment variable for the publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    clientSecret, 
    tierName, 
    tierId, 
    creatorId, 
    isUpgrade,
    subscriptionId
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
          <p className="text-gray-400 mb-4">No payment information found. Please try subscribing again.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscriptionPaymentForm 
        tierName={tierName}
        subscriptionId={subscriptionId}
        isUpgrade={isUpgrade}
      />
    </Elements>
  );
}
