
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderSummaryProps {
  isUpgrade: boolean;
  currentTierName?: string;
  tierName: string;
  monthlyAmount: number;
  fullTierMonthlyAmount: number;
  salesTax: number;
  totalToday: number;
}

export function OrderSummary({
  isUpgrade,
  currentTierName,
  tierName,
  monthlyAmount,
  fullTierMonthlyAmount,
  salesTax,
  totalToday
}: OrderSummaryProps) {
  return (
    <div className="lg:pl-8">
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>
            {isUpgrade ? 'Upgrade summary' : 'Order summary'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Creator Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                {tierName?.charAt(0) || 'C'}
              </span>
            </div>
            <div>
              <div className="font-medium">{tierName || 'Creator'}</div>
              <div className="text-muted-foreground text-sm">ULTRA Gamer</div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-3 pt-4 border-t border-border">
            {isUpgrade ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current tier ({currentTierName})</span>
                  <span className="text-muted-foreground line-through">
                    ${(fullTierMonthlyAmount - monthlyAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New tier ({tierName})</span>
                  <span>${fullTierMonthlyAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upgrade difference</span>
                  <span>${monthlyAmount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly payment</span>
                <span>${monthlyAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Sales Tax</span>
              <span>${salesTax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-3 border-t border-border">
              <span className="font-semibold">
                {isUpgrade ? "Upgrade cost today" : "Total due today"}
              </span>
              <span className="font-semibold">${totalToday.toFixed(2)}</span>
            </div>

            {isUpgrade && (
              <div className="text-xs text-muted-foreground pt-2">
                After upgrade: ${fullTierMonthlyAmount.toFixed(2)}/month on your existing billing date
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <button className="hover:text-foreground">Help Centre</button>
        <span>$ USD</span>
      </div>
    </div>
  );
}
