
import React from 'react';

interface PaymentTermsProps {
  isUpgrade: boolean;
  totalToday: number;
  monthlyAmount: number;
  fullTierMonthlyAmount: number;
}

export function PaymentTerms({ 
  isUpgrade, 
  totalToday, 
  monthlyAmount, 
  fullTierMonthlyAmount 
}: PaymentTermsProps) {
  return (
    <div className="text-sm text-gray-400 space-y-2">
      {isUpgrade ? (
        <p>
          You'll pay ${totalToday.toFixed(2)} today for the upgrade difference. 
          Your next regular charge of ${fullTierMonthlyAmount.toFixed(2)} will be on your existing billing date.
        </p>
      ) : (
        <p>
          You'll pay ${totalToday.toFixed(2)} today, and then ${monthlyAmount.toFixed(2)} monthly on the 1st. 
          Your next charge will be on 1 June.
        </p>
      )}
      <p>
        By clicking {isUpgrade ? 'Upgrade now' : 'Subscribe now'}, you agree to FanRealms's Terms of Use and Privacy Policy. 
        This subscription automatically renews monthly, and you'll be notified in advance if the monthly amount increases. 
        Cancel at any time in your membership settings.
      </p>
    </div>
  );
}
