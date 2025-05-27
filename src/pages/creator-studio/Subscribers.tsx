import { useState, useEffect } from "react";
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

  // Fetch active subscribers with corrected queries
  const { isLoading: loadingSubscribers, refetch: refetchSubscribers } = useQuery({
    queryKey: ["active-subscribers", creatorData?.id],
    queryFn: async () => {
      if (!creatorData?.id) return [];
      
      console.log('Fetching active subscribers for creator:', creatorData.id);
      
      // Query creator_subscriptions table with separate user lookup
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
          user_id
        `)
        .eq("creator_id", creatorData.id)
        .eq("status", "active");

      if (creatorSubsError) {
        console.error("Error fetching creator_subscriptions:", creatorSubsError);
      }

      // Query subscriptions table with separate user lookup
      const { data: regularSubs, error: regularSubsError } = await supabase
        .from("subscriptions")
        .select(`
          id,
          user_id,
          tier_id,
          created_at
        `)
        .eq("creator_id", creatorData.id)
        .eq("is_paid", true);

      if (regularSubsError) {
        console.error("Error fetching subscriptions:", regularSubsError);
      }

      // Use creator_subscriptions as primary source
      let subscriptionData = creatorSubs || [];
      
      // If no data in creator_subscriptions, fall back to subscriptions table
      if (subscriptionData.length === 0 && regularSubs && regularSubs.length > 0) {
        console.log('No data in creator_subscriptions, using subscriptions table');
        subscriptionData = regularSubs.map((sub: any) => ({
          id: sub.id,
          created_at: sub.created_at,
          tier_id: sub.tier_id,
          status: 'active',
          amount_paid: 0,
          current_period_start: null,
          current_period_end: null,
          stripe_subscription_id: '',
          user_id: sub.user_id
        }));
      }

      if (!subscriptionData || subscriptionData.length === 0) {
        console.log('No subscription data found');
        setSubscribers([]);
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(subscriptionData.map(sub => sub.user_id))];
      
      // Fetch user details separately
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, email, profile_picture")
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching users:", usersError);
      }

      // Get unique tier IDs
      const tierIds = [...new Set(subscriptionData.map(sub => sub.tier_id).filter(Boolean))];
      
      // Fetch tier details separately
      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select("id, title, price")
        .in("id", tierIds);

      if (tiersError) {
        console.error("Error fetching tiers:", tiersError);
      }

      // Create lookup maps
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);
      const tiersMap = new Map(tiersData?.map(tier => [tier.id, tier]) || []);

      // Transform the data to match SubscriberWithDetails format
      const formattedSubscribers: SubscriberWithDetails[] = subscriptionData.map((sub: any) => {
        const user = usersMap.get(sub.user_id);
        const tier = tiersMap.get(sub.tier_id);
        
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
      
      console.log('Formatted subscribers:', formattedSubscribers);
      setSubscribers(formattedSubscribers);
      return formattedSubscribers;
    },
    enabled: !!creatorData?.id,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 0 // Always consider data stale to ensure fresh fetches
  });

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate and refetch all related queries
      await queryClient.invalidateQueries({ queryKey: ["active-subscribers"] });
      await queryClient.invalidateQueries({ queryKey: ["creator-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["subscriber-tiers"] });
      await queryClient.invalidateQueries({ queryKey: ["userSubscriptions"] }); // Also invalidate user subscriptions
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
  };

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionUpdate = async () => {
      console.log('Subscribers: Subscription event detected, refreshing data...');
      await handleManualRefresh();
    };

    // Listen for custom subscription events
    window.addEventListener('subscriptionSuccess', handleSubscriptionUpdate);
    window.addEventListener('paymentSuccess', handleSubscriptionUpdate);
    window.addEventListener('subscriptionCanceled', handleSubscriptionUpdate);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionUpdate);
      window.removeEventListener('paymentSuccess', handleSubscriptionUpdate);
      window.removeEventListener('subscriptionCanceled', handleSubscriptionUpdate);
    };
  }, []);

  // Set up real-time subscription for creator_subscriptions table
  useEffect(() => {
    if (!creatorData?.id) return;

    console.log('Setting up real-time subscription for creator:', creatorData.id);
    
    const channel = supabase
      .channel('creator-subscriptions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creator_subscriptions',
        filter: `creator_id=eq.${creatorData.id}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        // Invalidate queries to refetch data
        queryClient.invalidateQueries({ queryKey: ["active-subscribers"] });
        queryClient.invalidateQueries({ queryKey: ["userSubscriptions"] });
        refetchSubscribers();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subscriptions',
        filter: `creator_id=eq.${creatorData.id}`
      }, (payload) => {
        console.log('Real-time subscriptions update received:', payload);
        queryClient.invalidateQueries({ queryKey: ["active-subscribers"] });
        queryClient.invalidateQueries({ queryKey: ["userSubscriptions"] });
        refetchSubscribers();
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [creatorData?.id, queryClient, refetchSubscribers]);

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
