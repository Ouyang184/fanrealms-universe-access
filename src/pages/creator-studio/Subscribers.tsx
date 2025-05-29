
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreatorSubscribers } from "@/hooks/useCreatorSubscribers";
import { useSubscriptionEventManager } from "@/hooks/useSubscriptionEventManager";
import { SubscriberStatsCards } from "@/components/creator-studio/subscribers/SubscriberStatsCards";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreatorStudioSubscribers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { invalidateAllSubscriptionQueries } = useSubscriptionEventManager();

  // Get creator ID
  const { data: creatorData } = useQuery({
    queryKey: ["creator-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Get subscribers using the hook
  const { subscribers, isLoading: loadingSubscribers, refetch } = useCreatorSubscribers(creatorData?.id || '');

  // Get membership tiers for tier information
  const { data: tiers = [] } = useQuery({
    queryKey: ['creatorMembershipTiers', creatorData?.id],
    queryFn: async () => {
      if (!creatorData?.id) return [];
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorData.id)
        .order('price', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!creatorData?.id
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('Manually refreshing subscriber data...');
      await Promise.all([
        refetch(),
        invalidateAllSubscriptionQueries()
      ]);
      console.log('Subscriber data refreshed successfully');
      toast({
        title: "Refreshed",
        description: "Subscriber data has been updated from Stripe",
      });
    } catch (error) {
      console.error('Error refreshing subscriber data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Listen for subscription events and refresh data
  useEffect(() => {
    const handleSubscriptionUpdate = async () => {
      console.log('Creator subscribers: Subscription event detected, refreshing...');
      try {
        await Promise.all([
          refetch(),
          invalidateAllSubscriptionQueries()
        ]);
      } catch (error) {
        console.error('Error refreshing subscriber data:', error);
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
  }, [refetch, invalidateAllSubscriptionQueries]);

  // Log subscribers data for debugging
  useEffect(() => {
    if (subscribers) {
      console.log('Current subscribers data:', { 
        count: subscribers.length,
        data: subscribers
      });
    }
  }, [subscribers]);

  // Calculate tier counts for stats
  const tierCounts = subscribers?.reduce((counts, subscriber) => {
    const tierName = subscriber.tier?.title || 'Unknown';
    counts[tierName] = (counts[tierName] || 0) + 1;
    return counts;
  }, {} as Record<string, number>) || {};

  // Filter active subscribers for accurate counts
  const activeSubscribers = subscribers?.filter(sub => 
    sub.status === 'active' || sub.status === 'cancelling'
  ) || [];

  const pendingSubscribers = subscribers?.filter(sub => 
    sub.status === 'pending'
  ) || [];

  return (
    <CreatorCheck>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
            <p className="text-muted-foreground">Manage and view your subscriber base synced with Stripe</p>
          </div>
          <Button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync with Stripe
          </Button>
        </div>

        {/* Debug Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-xs">
            Creator ID: {creatorData?.id || 'Not loaded'} | 
            Subscribers: {subscribers?.length || 0} | 
            Active/Cancelling: {activeSubscribers.length || 0} | 
            Pending: {pendingSubscribers.length || 0}
          </AlertDescription>
        </Alert>

        {/* Sync Status Alert */}
        {pendingSubscribers.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {pendingSubscribers.length} subscription(s) are pending payment confirmation. 
              They will appear as active once payment is processed by Stripe.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Enhanced Stats Cards */}
        <SubscriberStatsCards 
          subscribers={subscribers || []}
          tiers={tiers.map(tier => ({ 
            id: tier.id, 
            name: tier.title, 
            price: parseFloat(String(tier.price)) 
          }))}
          tierCounts={tierCounts}
          isLoading={loadingSubscribers}
        />
        
        {/* Subscribers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Subscribers</span>
              <Badge variant="secondary">{activeSubscribers.length} active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSubscribers ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : activeSubscribers.length > 0 ? (
              <div className="space-y-4">
                {activeSubscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={subscriber.user?.profile_picture || ''} />
                        <AvatarFallback>
                          {subscriber.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{subscriber.user?.username || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{subscriber.user?.email}</p>
                        {subscriber.current_period_end && (
                          <p className="text-xs text-muted-foreground">
                            Next billing: {new Date(subscriber.current_period_end).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{subscriber.tier?.title}</p>
                        <p className="text-sm text-muted-foreground">${subscriber.amount}/month</p>
                      </div>
                      <Badge 
                        variant={subscriber.status === 'cancelling' ? 'destructive' : 'default'}
                      >
                        {subscriber.status === 'cancelling' ? 'Cancelling' : 'Active'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active subscribers yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Subscribers will appear here once they complete payment through Stripe.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Subscriptions Section */}
        {pendingSubscribers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pending Subscriptions</span>
                <Badge variant="secondary">{pendingSubscribers.length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSubscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={subscriber.user?.profile_picture || ''} />
                        <AvatarFallback>
                          {subscriber.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{subscriber.user?.username || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{subscriber.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{subscriber.tier?.title}</p>
                        <p className="text-sm text-muted-foreground">${subscriber.amount}/month</p>
                      </div>
                      <Badge variant="secondary">Pending Payment</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CreatorCheck>
  );
}
