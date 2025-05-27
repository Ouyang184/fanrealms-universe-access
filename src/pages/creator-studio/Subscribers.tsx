
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { SubscriberWithDetails } from "@/types/creator-studio";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriberHeader } from "@/components/creator-studio/subscribers/SubscriberHeader";
import { SubscriberStatsCards } from "@/components/creator-studio/subscribers/SubscriberStatsCards";
import { SubscriberSearch } from "@/components/creator-studio/subscribers/SubscriberSearch";
import { SubscribersTable } from "@/components/creator-studio/subscribers/SubscribersTable";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Utility function to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Utility function to get tier badge variant
const getTierBadgeVariant = (tier: string): "default" | "secondary" | "outline" => {
  // You can customize this logic based on your tier naming convention
  const lowerTier = tier.toLowerCase();
  if (lowerTier.includes('premium') || lowerTier.includes('pro')) {
    return "default";
  } else if (lowerTier.includes('basic') || lowerTier.includes('starter')) {
    return "secondary";
  }
  return "outline";
};

export default function CreatorStudioSubscribers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [subscribers, setSubscribers] = useState<SubscriberWithDetails[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch creator ID
  const { data: creatorData, isLoading: creatorLoading } = useQuery({
    queryKey: ["creator-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
        
      if (error) {
        console.error("Error fetching creator profile:", error);
        toast({
          title: "Error",
          description: "Could not fetch creator profile",
          variant: "destructive"
        });
        return null;
      }
      
      return data;
    },
    enabled: !!user
  });

  // Fetch creator's tiers
  const { data: tiers = [] } = useQuery({
    queryKey: ["subscriber-tiers", creatorData?.id],
    queryFn: async () => {
      if (!creatorData?.id) return [];
      
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("creator_id", creatorData.id)
        .order("price", { ascending: true });
      
      if (error) {
        console.error("Error fetching tiers:", error);
        toast({
          title: "Error",
          description: "Could not fetch membership tiers",
          variant: "destructive"
        });
        return [];
      }
      
      return data.map(tier => ({
        id: tier.id,
        name: tier.title,
        price: tier.price
      }));
    },
    enabled: !!creatorData?.id
  });

  // Enhanced fetch active subscribers with better error handling
  const { isLoading: loadingSubscribers, refetch: refetchSubscribers } = useQuery({
    queryKey: ["active-subscribers", creatorData?.id],
    queryFn: async () => {
      if (!creatorData?.id) return [];
      
      console.log('Fetching active subscribers for creator:', creatorData.id);
      
      // Query creator_subscriptions table with proper joins
      const { data: creatorSubs, error: creatorSubsError } = await supabase
        .from("creator_subscriptions")
        .select(`
          id,
          created_at,
          tier_id,
          status,
          amount_paid,
          current_period_start,
          current_period_end,
          stripe_subscription_id,
          user_id,
          tier:membership_tiers!tier_id (
            id,
            title,
            price
          )
        `)
        .eq("creator_id", creatorData.id)
        .eq("status", "active");

      if (creatorSubsError) {
        console.error("Error fetching creator_subscriptions:", creatorSubsError);
        throw creatorSubsError;
      }

      let subscriptionData = creatorSubs || [];
      console.log('Found creator subscriptions:', subscriptionData.length);

      if (!subscriptionData || subscriptionData.length === 0) {
        console.log('No active subscriptions found');
        setSubscribers([]);
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(subscriptionData.map(sub => sub.user_id))];
      console.log('Fetching user details for IDs:', userIds);
      
      // Fetch user details separately
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, email, profile_picture")
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }

      console.log('Found users:', usersData?.length);

      // Create lookup map
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);

      // Transform the data to match SubscriberWithDetails format
      const formattedSubscribers: SubscriberWithDetails[] = subscriptionData.map((sub: any) => {
        const user = usersMap.get(sub.user_id);
        const tier = sub.tier;
        
        return {
          id: sub.id,
          name: user?.username || "Unknown User",
          email: user?.email || "No email",
          tier: tier?.title || "Unknown Tier",
          tierPrice: sub.amount_paid || tier?.price || 0,
          subscriptionDate: sub.created_at,
          avatarUrl: user?.profile_picture || undefined,
          status: sub.status as 'active' | 'expired' | 'pending'
        };
      });
      
      console.log('Formatted subscribers:', formattedSubscribers.length);
      setSubscribers(formattedSubscribers);
      return formattedSubscribers;
    },
    enabled: !!creatorData?.id,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0 // Always consider data stale
  });

  // Enhanced manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      console.log('Manual refresh triggered');
      
      // Invalidate and refetch all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["active-subscribers"] }),
        queryClient.invalidateQueries({ queryKey: ["creator-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["subscriber-tiers"] }),
        queryClient.invalidateQueries({ queryKey: ["enhancedUserSubscriptions"] }),
        queryClient.invalidateQueries({ queryKey: ["creatorMembershipTiers"] }),
      ]);
      
      await refetchSubscribers();
      
      toast({
        title: "Refreshed",
        description: "Subscriber data has been updated",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, refetchSubscribers, toast]);

  // Enhanced subscription event listener
  useEffect(() => {
    const handleSubscriptionUpdate = async (event: CustomEvent) => {
      console.log('Subscribers: Subscription event detected:', event.type, event.detail);
      await handleManualRefresh();
    };

    // Listen for custom subscription events
    const events = [
      'subscriptionSuccess',
      'paymentSuccess', 
      'subscriptionCreated',
      'subscriptionUpdated',
      'subscriptionCanceled'
    ];

    events.forEach(eventType => {
      window.addEventListener(eventType, handleSubscriptionUpdate as EventListener);
    });
    
    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleSubscriptionUpdate as EventListener);
      });
    };
  }, [handleManualRefresh]);

  // Enhanced real-time subscription for creator_subscriptions table
  useEffect(() => {
    if (!creatorData?.id) return;

    console.log('Setting up real-time subscription for creator:', creatorData.id);
    
    const channel = supabase
      .channel(`creator-subscriptions-${creatorData.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creator_subscriptions',
        filter: `creator_id=eq.${creatorData.id}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        // Trigger immediate refresh with a small delay to ensure data consistency
        setTimeout(() => {
          handleManualRefresh();
        }, 1000);
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [creatorData?.id, handleManualRefresh]);

  // Filter subscribers based on search term and tier filter
  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = searchTerm.trim() === "" || 
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTier = filterTier === "all" || subscriber.tier === filterTier;
    
    return matchesSearch && matchesTier;
  });

  // Count subscribers by tier
  const tierCounts = subscribers.reduce((acc, subscriber) => {
    acc[subscriber.tier] = (acc[subscriber.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <CreatorCheck>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <SubscriberHeader />
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
        
        <SubscriberStatsCards 
          subscribers={subscribers} 
          tiers={tiers} 
          tierCounts={tierCounts}
          isLoading={loadingSubscribers}
        />
        
        <SubscriberSearch 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterTier={filterTier}
          setFilterTier={setFilterTier}
          tiers={tiers}
          subscribers={subscribers}
        />
        
        <Card>
          <SubscribersTable 
            filteredSubscribers={filteredSubscribers}
            formatDate={formatDate}
            getTierBadgeVariant={getTierBadgeVariant}
            isLoading={loadingSubscribers}
          />
        </Card>
      </div>
    </CreatorCheck>
  );
}
