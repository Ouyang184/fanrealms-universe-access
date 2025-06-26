
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
    stripeStatus, 
    isLoading, 
    createStripeAccount, 
    isConnecting 
  } = useStripeConnect();

  if (isLoading) {
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

  const isConnected = (stripeStatus as any)?.stripe_account_id;
  const isOnboardingComplete = (stripeStatus as any)?.stripe_onboarding_complete;
  const canReceivePayments = (stripeStatus as any)?.stripe_charges_enabled;

  const createLoginLink = async (accountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect', {
        body: { 
          action: 'create_login_link',
          accountId: accountId
        }
      });

      if (error) throw error;
      
      if (data?.loginUrl) {
        window.open(data.loginUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating login link:', error);
    }
  };

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
              onClick={() => creatorProfile && createStripeAccount((creatorProfile as any).id)}
              disabled={!creatorProfile || isConnecting}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Connect Stripe Account
            </Button>
          ) : !isOnboardingComplete ? (
            // Show Complete Onboarding button for connected but incomplete accounts
            <Button 
              onClick={() => creatorProfile && createStripeAccount((creatorProfile as any).id)}
              variant="default"
              disabled={isConnecting}
            >
              Complete Onboarding
            </Button>
          ) : (
            // Only show dashboard access for fully onboarded accounts
            <Button
              variant="outline"
              onClick={() => createLoginLink((stripeStatus as any).stripe_account_id)}
              disabled={isConnecting}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Stripe Dashboard
            </Button>
          )}
        </div>

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
