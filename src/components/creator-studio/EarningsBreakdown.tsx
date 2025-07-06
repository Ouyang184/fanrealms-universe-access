
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCreatorEarnings } from '@/hooks/useCreatorEarnings';
import { DollarSign, TrendingUp, Users, Palette } from 'lucide-react';
import { formatRelativeDate } from '@/utils/auth-helpers';

export function EarningsBreakdown() {
  const { earnings, summary, isLoading } = useCreatorEarnings();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">${summary.totalNetEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  ${summary.totalEarnings.toFixed(2)} before fees
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subscription Earnings</p>
                <p className="text-2xl font-bold">${summary.subscriptionNetEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  ${summary.subscriptionEarnings.toFixed(2)} before fees
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Earnings</p>
                <p className="text-2xl font-bold">${summary.commissionNetEarnings.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  ${summary.commissionEarnings.toFixed(2)} before fees
                </p>
              </div>
              <Palette className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No earnings recorded yet. Start creating content or accepting commissions to see your earnings here!
            </p>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      earning.earning_type === 'subscription' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {earning.earning_type === 'subscription' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        <Palette className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={earning.earning_type === 'subscription' ? 'default' : 'secondary'}>
                          {earning.earning_type === 'subscription' ? 'Subscription' : 'Commission'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {earning.payment_date ? formatRelativeDate(earning.payment_date) : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Platform fee: ${earning.platform_fee.toFixed(2)} ({
                          earning.earning_type === 'subscription' ? '5%' : '4%'
                        })
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${earning.net_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      ${earning.amount.toFixed(2)} gross
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Information */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Subscription earnings</span>
              <Badge variant="outline">5% platform fee</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm">Commission earnings</span>
              <Badge variant="outline">4% platform fee</Badge>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Platform fees are automatically deducted from your gross earnings. 
              The amounts shown above are your net earnings after fees.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
