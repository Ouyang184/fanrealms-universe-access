
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, RefreshCw } from "lucide-react"
import { useSubscriptions } from "@/hooks/useSubscriptions"
import { useEffect, useState, useCallback, useMemo } from "react"
import LoadingSpinner from "@/components/LoadingSpinner"
import { useToast } from "@/hooks/use-toast"
import { SubscriptionSummary } from "@/components/subscriptions/SubscriptionSummary"
import { EmptySubscriptionsState } from "@/components/subscriptions/EmptySubscriptionsState"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSubscriptionEventManager } from "@/hooks/useSubscriptionEventManager"
import { MainLayout } from "@/components/Layout/MainLayout"
import { FilterModal, FilterOptions } from "@/components/subscriptions/FilterModal"
import { PaymentMethodsModal } from "@/components/subscriptions/PaymentMethodsModal"

export default function SubscriptionsPage() {
  const { userSubscriptions, subscriptionsLoading, cancelSubscription, refetchSubscriptions } = useSubscriptions();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { triggerSubscriptionCancellation, invalidateAllSubscriptionQueries } = useSubscriptionEventManager();
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    priceRange: { min: 0, max: 1000 },
    sortBy: "created_at",
    sortOrder: "desc"
  });
  
  // Stable callback to avoid infinite loops
  const stableRefetch = useCallback(async () => {
    console.log('Subscriptions page loaded, refreshing data...');
    await refetchSubscriptions();
  }, [refetchSubscriptions]);

  // Only refresh on mount, not on every render
  useEffect(() => {
    stableRefetch();
  }, []); // Empty dependency array - only run on mount

  // Listen for subscription events using the event manager
  useEffect(() => {
    const handleSubscriptionUpdate = async () => {
      console.log('Subscription event detected, refreshing...');
      setIsRefreshing(true);
      try {
        await invalidateAllSubscriptionQueries();
        toast({
          title: "Updated",
          description: "Subscription data has been refreshed",
        });
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const events = ['subscriptionSuccess', 'paymentSuccess', 'subscriptionCancelled'];
    events.forEach(eventType => {
      window.addEventListener(eventType, handleSubscriptionUpdate);
    });
    
    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleSubscriptionUpdate);
      });
    };
  }, [invalidateAllSubscriptionQueries, toast]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await invalidateAllSubscriptionQueries();
      toast({
        title: "Refreshed",
        description: "Subscription data has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh subscription data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await cancelSubscription(subscriptionId);
      
      // Trigger cancellation event
      triggerSubscriptionCancellation({ subscriptionId });
      
      // Force refresh
      await invalidateAllSubscriptionQueries();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  

  // Filter and sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (!userSubscriptions) return [];
    
    let filtered = userSubscriptions.filter(subscription => {
      // Status filter
      if (filters.status !== "all" && subscription.status !== filters.status) {
        return false;
      }
      
      // Price range filter
      const amount = Number(subscription.amount) || 0;
      if (amount < filters.priceRange.min || amount > filters.priceRange.max) {
        return false;
      }
      
      return true;
    });

    // Sort subscriptions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case "amount":
          aValue = Number(a.amount) || 0;
          bValue = Number(b.amount) || 0;
          break;
        case "creator_name":
          aValue = a.creators?.display_name || "";
          bValue = b.creators?.display_name || "";
          break;
        case "next_billing":
          aValue = a.current_period_end ? new Date(a.current_period_end).getTime() : 0;
          bValue = b.current_period_end ? new Date(b.current_period_end).getTime() : 0;
          break;
        default: // created_at
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }
      
      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [userSubscriptions, filters]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "all") count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) count++;
    if (filters.sortBy !== "created_at" || filters.sortOrder !== "desc") count++;
    return count;
  }, [filters]);

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
            <FilterModal 
              filters={filters}
              onFiltersChange={setFilters}
              activeFiltersCount={activeFiltersCount}
            />
            <PaymentMethodsModal>
              <Button variant="outline" size="sm" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Methods
              </Button>
            </PaymentMethodsModal>
          </div>
        </div>

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
                  Active Subscriptions ({filteredSubscriptions?.length || 0})
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="billing">
                  Billing History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscriptions" className="mt-6">
                {filteredSubscriptions.length === 0 && userSubscriptions && userSubscriptions.length > 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No subscriptions match your current filters.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => setFilters({
                          status: "all",
                          priceRange: { min: 0, max: 1000 },
                          sortBy: "created_at",
                          sortOrder: "desc"
                        })}
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredSubscriptions?.map((subscription) => (
                      <Card key={subscription.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {subscription.creators?.display_name?.charAt(0) || 'C'}
                                </span>
                              </div>
                              <div>
                                <CardTitle className="text-lg">{subscription.creators?.display_name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{subscription.membership_tiers?.title}</p>
                              </div>
                            </div>
                            <Badge variant="default">Active</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Monthly Price</span>
                              <span className="font-semibold">${subscription.amount}/month</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Next Billing</span>
                              <span className="text-sm">
                                {subscription.current_period_end 
                                  ? new Date(subscription.current_period_end).toLocaleDateString()
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            <div className="pt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleCancelSubscription(subscription.id)}
                                className="w-full"
                              >
                                Cancel Subscription
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="billing" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No billing history available yet.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  )
}
