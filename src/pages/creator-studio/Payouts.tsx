
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStripeConnect } from '@/hooks/useStripeConnect';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { EarningsBreakdown } from '@/components/creator-studio/EarningsBreakdown';
import { WebhookDiagnostics } from '@/components/creator-studio/WebhookDiagnostics';
import { 
  DollarSign, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  CreditCard,
  TrendingUp,
  Webhook
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function Payouts() {
  const { creatorProfile } = useCreatorProfile();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const { 
    connectStatus, 
    statusLoading, 
    createLoginLink, 
    syncAccountStatus,
    balance,
    refetchBalance,
    isLoading
  } = useStripeConnect();

  const handleSyncEarnings = async () => {
    if (!connectStatus?.stripe_account_id) {
      toast({
        title: "Error",
        description: "No Stripe account connected. Please connect your Stripe account first.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe-earnings');
      
      if (error) throw error;
      
      // Refresh balance after sync
      await refetchBalance();
      
      toast({
        title: "Earnings Synced",
        description: `Synced ${data.syncedCount} earnings (${data.commissionCount} commissions, ${data.subscriptionCount} subscriptions)`,
      });
    } catch (error) {
      console.error('Error syncing earnings:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync earnings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const isConnected = connectStatus?.stripe_account_id;
  const isOnboardingComplete = connectStatus?.stripe_onboarding_complete;
  const canReceivePayments = connectStatus?.stripe_charges_enabled;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">
            Manage your earnings and payout settings (TEST MODE)
          </p>
        </div>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect Status
          </CardTitle>
          <CardDescription>
            Your payout account connection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {canReceivePayments ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">
                  {isConnected 
                    ? isOnboardingComplete 
                      ? 'Ready to receive payments'
                      : 'Complete onboarding to receive payments'
                    : 'No Stripe account connected'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Stripe account connected' : 'Connect your Stripe account to start receiving payments'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={canReceivePayments ? "default" : "secondary"}>
                {canReceivePayments ? "Active" : "Setup Required"}
              </Badge>
              {canReceivePayments && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createLoginLink(connectStatus.stripe_account_id)}
                  disabled={isLoading}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Stripe Dashboard
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {canReceivePayments ? (
        <Tabs defaultValue="earnings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="balance">Account Balance</TabsTrigger>
            <TabsTrigger value="diagnostics">Webhook Diagnostics</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Earnings Overview
              </h2>
              <Button
                onClick={handleSyncEarnings}
                disabled={isSyncing}
                variant="outline"
              >
                {isSyncing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Earnings
              </Button>
            </div>
            <EarningsBreakdown />
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Stripe Account Balance (TEST MODE)
                </CardTitle>
                <CardDescription>
                  Your current account balance in Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {balance ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${(balance.available?.[0]?.amount || 0) / 100}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ready for payout
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ${(balance.pending?.[0]?.amount || 0) / 100}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Being processed
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Unable to load balance information. Please try refreshing or check your Stripe connection.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Webhook className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Webhook Diagnostics</h2>
            </div>
            <WebhookDiagnostics />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Complete Stripe Setup</h3>
            <p className="text-muted-foreground mb-4">
              You need to complete your Stripe account setup before you can view earnings and payouts.
            </p>
            <Button
              onClick={() => window.location.href = '/creator-studio/settings'}
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
