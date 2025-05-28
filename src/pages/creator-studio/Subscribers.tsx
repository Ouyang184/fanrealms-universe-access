
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreatorSubscribers } from "@/hooks/useCreatorSubscribers";
import { useSubscriptionEventManager } from "@/hooks/useSubscriptionEventManager";

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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        invalidateAllSubscriptionQueries()
      ]);
      toast({
        title: "Refreshed",
        description: "Subscriber data has been updated",
      });
    } catch (error) {
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

  const totalSubscribers = subscribers?.length || 0;
  const totalRevenue = subscribers?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0;

  return (
    <CreatorCheck>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
            <p className="text-muted-foreground">Manage and view your subscriber base</p>
          </div>
          <Button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubscribers}</div>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From active subscriptions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average per Subscriber</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalSubscribers > 0 ? (totalRevenue / totalSubscribers).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Monthly average</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Subscribers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSubscribers ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : subscribers && subscribers.length > 0 ? (
              <div className="space-y-4">
                {subscribers.map((subscriber) => (
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{subscriber.tier?.title}</p>
                        <p className="text-sm text-muted-foreground">${subscriber.amount}/month</p>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active subscribers yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CreatorCheck>
  );
}
