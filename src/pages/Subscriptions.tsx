
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter, CreditCard, RefreshCw, RotateCcw } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { useStripeSubscription } from "@/hooks/useStripeSubscription"
import { useEffect, useState } from "react"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useToast } from "@/hooks/use-toast"
import { SubscriptionSummary } from "@/components/subscriptions/SubscriptionSummary"
import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard"
import { BillingHistory } from "@/components/subscriptions/BillingHistory"
import { EmptySubscriptionsState } from "@/components/subscriptions/EmptySubscriptionsState"
import { ForceCancelButton } from "@/components/creator/buttons/ForceCancelButton"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { userSubscriptions, subscriptionsLoading, cancelSubscription, refetchSubscriptions } = useStripeSubscription();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();
  
  // Auto-refresh on page load and listen for subscription events
  useEffect(() => {
    console.log('Subscriptions page loaded, refreshing data...');
    refetchSubscriptions();

    const handleSubscriptionUpdate = async (eventType: string) => {
      console.log(`${eventType} event detected on subscriptions page`);
      setIsRefreshing(true);
      try {
        await refetchSubscriptions();
        toast({
          title: "Updated",
          description: "Subscription data has been refreshed",
        });
      } catch (error) {
        console.error('Error refreshing on subscription update:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Listen for subscription events
    const handleSubscriptionSuccess = () => handleSubscriptionUpdate('subscriptionSuccess');
    const handlePaymentSuccess = () => handleSubscriptionUpdate('paymentSuccess');
    const handleSubscriptionCanceled = () => handleSubscriptionUpdate('subscriptionCanceled');
    
    window.addEventListener('subscriptionSuccess', handleSubscriptionSuccess);
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    window.addEventListener('subscriptionCanceled', handleSubscriptionCanceled);
    
    // Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing subscriptions...');
        refetchSubscriptions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing subscriptions...');
      refetchSubscriptions();
    }, 30000);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionSuccess);
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionCanceled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [refetchSubscriptions, toast]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('Manual refresh triggered');
      await refetchSubscriptions();
      toast({
        title: "Refreshed",
        description: "Subscription data has been updated",
      });
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      console.log('Full sync triggered');
      
      // Call the sync function
      const { data, error } = await supabase.functions.invoke('stripe-subscriptions', {
        body: {
          action: 'sync_all_subscriptions'
        }
      });

      if (error) {
        throw error;
      }

      console.log('Sync result:', data);
      
      // Refresh the data after sync
      await refetchSubscriptions();
      
      toast({
        title: "Sync Complete",
        description: data?.message || "All subscription data has been synchronized with Stripe",
      });
    } catch (error) {
      console.error('Error syncing subscriptions:', error);
      toast({
        title: "Sync Error",
        description: "Failed to synchronize subscription data",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDebugCheck = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Running debug check for user:', user.id);
      
      // Check both subscription tables directly
      const [creatorSubs, basicSubs] = await Promise.all([
        supabase
          .from('creator_subscriptions')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
      ]);

      const debugData = {
        userId: user.id,
        userEmail: user.email,
        creatorSubscriptions: creatorSubs.data || [],
        basicSubscriptions: basicSubs.data || [],
        creatorSubsError: creatorSubs.error,
        basicSubsError: basicSubs.error,
        timestamp: new Date().toISOString()
      };

      console.log('Debug data:', debugData);
      setDebugInfo(debugData);

      toast({
        title: "Debug Complete",
        description: "Check console for detailed subscription data",
      });
    } catch (error) {
      console.error('Debug check failed:', error);
    }
  };

  if (subscriptionsLoading && !isRefreshing) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  const hasSubscriptions = userSubscriptions && userSubscriptions.length > 0;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Your Subscriptions</h1>
          <div className="flex items-center gap-3">
            <ForceCancelButton />
            <Button 
              onClick={handleDebugCheck}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              🐛 Debug
            </Button>
            <Button 
              onClick={handleSyncAll}
              disabled={isSyncing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync All'}
            </Button>
            <Button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Updating...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Methods
            </Button>
          </div>
        </div>

        {debugInfo && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <pre className="text-xs overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {!hasSubscriptions ? (
          <EmptySubscriptionsState 
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        ) : (
          <>
            <SubscriptionSummary subscriptions={userSubscriptions} />

            <Tabs defaultValue="subscriptions" className="mb-8">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="subscriptions">
                  Active Subscriptions ({userSubscriptions?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="billing">
                  Billing History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscriptions" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {userSubscriptions?.map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      onCancel={cancelSubscription}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="billing" className="mt-6">
                <BillingHistory subscriptions={userSubscriptions} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  )
}
