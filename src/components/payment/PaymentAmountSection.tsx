
import React from 'react';
import { Input } from '@/components/ui/input';

interface PaymentAmountSectionProps {
  isUpgrade: boolean;
  currentTierName?: string;
  tierName: string;
  monthlyAmount: number;
  fullTierMonthlyAmount: number;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
}

export function PaymentAmountSection({
  isUpgrade,
  currentTierName,
  tierName,
  monthlyAmount,
  fullTierMonthlyAmount,
  paymentAmount,
  setPaymentAmount
}: PaymentAmountSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Payment amount</h2>
        <p className="text-muted-foreground text-sm mb-4">
          {isUpgrade 
            ? "Pay only the difference between your current tier and the new tier."
            : "Pay the set price or you can choose to pay more."
          }
        </p>
        
        <div className="space-y-3">
          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">
                  {isUpgrade ? "Upgrade difference" : "Monthly payment"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isUpgrade 
                    ? `$${monthlyAmount.toFixed(2)} (${tierName}: $${fullTierMonthlyAmount.toFixed(2)}/month)`
                    : `$${monthlyAmount.toFixed(2)}/month`
                  }
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-muted-foreground mr-2">$</span>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-20 bg-transparent text-right"
                  step="0.01"
                  min={monthlyAmount}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
