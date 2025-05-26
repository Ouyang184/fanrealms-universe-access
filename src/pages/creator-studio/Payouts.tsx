
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Table as TableIcon, DollarSign, ExternalLink, TrendingUp, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CreatorStudioPayouts() {
  const { user } = useAuth();
  const { creatorProfile } = useCreatorProfile();
  const { connectStatus, balance, createLoginLink } = useStripeConnect();
  const queryClient = useQueryClient();

  // Manual sync mutation
  const { mutate: syncEarnings, isPending: isSyncing } = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-stripe-earnings');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creatorEarnings'] });
      queryClient.invalidateQueries({ queryKey: ['stripeBalance'] });
      queryClient.invalidateQueries({ queryKey: ['stripeConnectStatus'] });
      toast({
        title: "Sync completed",
        description: `${data?.syncedCount || 0} new earnings synced from Stripe.`,
      });
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync earnings from Stripe. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Fetch creator earnings
  const { data: earnings = [], isLoading: earningsLoading } = useQuery({
    queryKey: ['creatorEarnings', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!creatorProfile?.id
  });

  // Calculate totals
  const totalEarnings = earnings.reduce((sum, earning) => sum + (earning.net_amount || 0), 0);
  const monthlyEarnings = earnings
    .filter(earning => {
      const earningDate = new Date(earning.created_at);
      const now = new Date();
      return earningDate.getMonth() === now.getMonth() && earningDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, earning) => sum + (earning.net_amount || 0), 0);

  const availableBalance = balance?.available?.[0]?.amount ? balance.available[0].amount / 100 : 0;

  if (earningsLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">Manage your earnings and payouts from Stripe</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => syncEarnings()}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync from Stripe
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync Status Alert */}
      {connectStatus?.stripe_account_id && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Webhook Status</AlertTitle>
          <AlertDescription>
            Your earnings are automatically synced via webhooks. If you notice missing data or status issues, 
            use the "Sync from Stripe" button above to manually refresh your account status and earnings.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-2xl font-bold">${availableBalance.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-2xl font-bold">${monthlyEarnings.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-2xl font-bold">${totalEarnings.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Dashboard Access */}
      {connectStatus?.stripe_account_id && (
        <Card>
          <CardHeader>
            <CardTitle>Stripe Dashboard</CardTitle>
            <CardDescription>Access your full Stripe dashboard for detailed analytics and payout management</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => createLoginLink(connectStatus.stripe_account_id)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Stripe Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Earnings</CardTitle>
            <CardDescription>View your recent earnings and transactions</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>A list of your recent earnings</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Gross Amount</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead className="text-right">Net Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.length > 0 ? (
                earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      {new Date(earning.payment_date || earning.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>Subscription Payment</TableCell>
                    <TableCell>${earning.amount.toFixed(2)}</TableCell>
                    <TableCell>-${earning.platform_fee.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${earning.net_amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <TableIcon className="h-10 w-10 mb-2" />
                      <p>No earnings found</p>
                      <p className="text-sm">Your earnings will appear here when you receive payments</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {!connectStatus?.stripe_onboarding_complete && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Stripe Setup Required</AlertTitle>
          <AlertDescription>
            To receive payouts, you need to complete your Stripe Connect onboarding. 
            Go to Settings → Payments to get started.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
