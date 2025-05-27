
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter, CreditCard, RefreshCw } from "lucide-react"
import { MainLayout } from "@/components/Layout/MainLayout"
import { useStripeSubscription } from "@/hooks/useStripeSubscription"
import { useEffect, useState } from "react"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useToast } from "@/hooks/use-toast"
import { SubscriptionSummary } from "@/components/subscriptions/SubscriptionSummary"
import { SubscriptionCard } from "@/components/subscriptions/SubscriptionCard"
import { BillingHistory } from "@/components/subscriptions/BillingHistory"
import { EmptySubscriptionsState } from "@/components/subscriptions/EmptySubscriptionsState"

export default function SubscriptionsPage() {
  const { userSubscriptions, subscriptionsLoading, cancelSubscription, refetchSubscriptions } = useStripeSubscription();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  // Auto-refresh on page load and listen for subscription events
  useEffect(() => {
    console.log('Subscriptions page loaded, refreshing data...');
    refetchSubscriptions();

    const handleSubscriptionUpdate = async () => {
      console.log('Subscription update event detected on subscriptions page');
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

    // Listen for subscription events with more immediate response
    window.addEventListener('subscriptionSuccess', handleSubscriptionUpdate);
    window.addEventListener('paymentSuccess', handleSubscriptionUpdate);
    window.addEventListener('subscriptionCanceled', handleSubscriptionUpdate);
    
    // Also listen for page visibility changes to refresh when user returns
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing subscriptions...');
        refetchSubscriptions();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionUpdate);
      window.removeEventListener('paymentSuccess', handleSubscriptionUpdate);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  if (!hasSubscriptions) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Your Subscriptions</h1>
            <Button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <EmptySubscriptionsState 
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Your Subscriptions</h1>
          <div className="flex items-center gap-3">
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
      </div>
    </MainLayout>
  )
}
