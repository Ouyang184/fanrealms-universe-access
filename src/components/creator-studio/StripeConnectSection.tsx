
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { ExternalLink, CreditCard, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export function StripeConnectSection() {
  const { creatorProfile } = useCreatorProfile();
  const { 
    connectStatus, 
    statusLoading, 
    createConnectAccount, 
    createLoginLink, 
    balance,
    isLoading 
  } = useStripeConnect();

  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = connectStatus?.stripe_account_id;
  const isOnboardingComplete = connectStatus?.stripe_onboarding_complete;
  const canReceivePayments = connectStatus?.stripe_charges_enabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Connect
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to receive payments from subscribers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <div>
              <p className="font-medium">
                {isConnected ? 'Stripe Account Connected' : 'No Stripe Account'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected 
                  ? isOnboardingComplete 
                    ? 'Ready to receive payments'
                    : 'Complete onboarding to receive payments'
                  : 'Connect your Stripe account to start receiving payments'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={canReceivePayments ? "default" : "secondary"}>
              {canReceivePayments ? "Active" : "Setup Required"}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={() => creatorProfile && createConnectAccount(creatorProfile.id)}
              disabled={!creatorProfile}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Connect Stripe Account
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => createLoginLink(connectStatus.stripe_account_id)}
                disabled={isLoading}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Stripe Dashboard
              </Button>
              
              {!isOnboardingComplete && (
                <Button 
                  onClick={() => creatorProfile && createConnectAccount(creatorProfile.id)}
                  variant="default"
                >
                  Complete Onboarding
                </Button>
              )}
            </>
          )}
        </div>

        {/* Balance Display */}
        {canReceivePayments && balance && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Available Balance</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-600">Available:</p>
                <p className="font-mono font-medium">
                  ${(balance.available?.[0]?.amount || 0) / 100}
                </p>
              </div>
              <div>
                <p className="text-green-600">Pending:</p>
                <p className="font-mono font-medium">
                  ${(balance.pending?.[0]?.amount || 0) / 100}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>• FanRealms takes a 5% platform fee from all subscriptions</p>
          <p>• Payments are processed securely through Stripe</p>
          <p>• You'll receive payments directly to your bank account</p>
        </div>
      </CardContent>
    </Card>
  );
}
