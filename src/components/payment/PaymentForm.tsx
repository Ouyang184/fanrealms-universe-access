
import React from 'react';
import { useLocation } from 'react-router-dom';
import { MembershipPaymentForm } from './MembershipPaymentForm';

export function PaymentForm() {
  const location = useLocation();
  const { 
    clientSecret, 
    tierName, 
    amount,
    isUpgrade 
  } = location.state || {};

  if (!clientSecret || !tierName || !amount) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Payment Error</h1>
          <p className="text-gray-400">Missing payment information. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <MembershipPaymentForm
      clientSecret={clientSecret}
      tierName={tierName}
      amount={amount}
      isUpgrade={isUpgrade}
    />
  );
}
