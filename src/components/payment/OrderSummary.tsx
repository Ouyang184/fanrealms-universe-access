
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
      <Card className="bg-gray-900 border-gray-800 sticky top-6">
        <CardHeader>
          <CardTitle className="text-white">
            {isUpgrade ? 'Upgrade summary' : 'Order summary'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Creator Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {tierName?.charAt(0) || 'C'}
              </span>
            </div>
            <div>
              <div className="text-white font-medium">{tierName || 'Creator'}</div>
              <div className="text-gray-400 text-sm">ULTRA Gamer</div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-3 pt-4 border-t border-gray-700">
            {isUpgrade ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current tier ({currentTierName})</span>
                  <span className="text-gray-500 line-through">
                    ${(fullTierMonthlyAmount - monthlyAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New tier ({tierName})</span>
                  <span className="text-white">${fullTierMonthlyAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Upgrade difference</span>
                  <span className="text-white">${monthlyAmount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-400">Monthly payment</span>
                <span className="text-white">${monthlyAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-400">Sales Tax</span>
              <span className="text-white">${salesTax.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between pt-3 border-t border-gray-700">
              <span className="text-white font-semibold">
                {isUpgrade ? "Upgrade cost today" : "Total due today"}
              </span>
              <span className="text-white font-semibold">${totalToday.toFixed(2)}</span>
            </div>
            
            {isUpgrade && (
              <div className="text-xs text-gray-400 pt-2">
                After upgrade: ${fullTierMonthlyAmount.toFixed(2)}/month on your existing billing date
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
        <button className="hover:text-white">Help Centre</button>
        <span>$ USD</span>
      </div>
    </div>
  );
}
