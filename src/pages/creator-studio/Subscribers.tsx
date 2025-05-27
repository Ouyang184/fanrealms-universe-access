
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

  // Fetch active subscribers with improved real-time updates
  const { isLoading: loadingSubscribers, refetch: refetchSubscribers } = useQuery({
    queryKey: ["active-subscribers", creatorData?.id],
    queryFn: async () => {
      if (!creatorData?.id) return [];
      
      console.log('Fetching active subscribers for creator:', creatorData.id);
      
      // First, let's check both creator_subscriptions and subscriptions tables
      const [creatorSubsResult, subsResult] = await Promise.all([
        supabase
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
            users!creator_subscriptions_user_id_fkey(
              id,
              email,
              username,
              profile_picture
            ),
            membership_tiers!creator_subscriptions_tier_id_fkey(
              id,
              title,
              price
            )
          `)
          .eq("creator_id", creatorData.id)
          .eq("status", "active"),
        
        supabase
          .from("subscriptions")
          .select(`
            *,
            users!subscriptions_user_id_fkey(
              id,
              email,
              username,
              profile_picture
            ),
            membership_tiers!subscriptions_tier_id_fkey(
              id,
              title,
              price
            )
          `)
          .eq("creator_id", creatorData.id)
          .eq("is_paid", true)
      ]);
      
      console.log('Creator subscriptions result:', creatorSubsResult);
      console.log('Subscriptions result:', subsResult);
      
      // Use creator_subscriptions as primary source since it has more detailed payment info
      let data = creatorSubsResult.data || [];
      
      // If no data in creator_subscriptions, fall back to subscriptions table
      if (data.length === 0 && subsResult.data && subsResult.data.length > 0) {
        console.log('No data in creator_subscriptions, using subscriptions table');
        data = subsResult.data.map((sub: any) => ({
          id: sub.id,
          created_at: sub.created_at,
          tier_id: sub.tier_id,
          status: 'active',
          amount_paid: sub.membership_tiers?.price || 0,
          users: sub.users,
          membership_tiers: sub.membership_tiers
        }));
      }
      
      if (creatorSubsResult.error && subsResult.error) {
        console.error("Error fetching subscribers:", creatorSubsResult.error, subsResult.error);
        toast({
          title: "Error",
          description: "Could not fetch subscribers",
          variant: "destructive"
        });
        return [];
      }
      
      console.log('Final subscriber data:', data);
      
      // Transform the data to match SubscriberWithDetails format
      const formattedSubscribers: SubscriberWithDetails[] = data.map((sub: any) => ({
        id: sub.id,
        name: sub.users?.username || "Unknown User",
        email: sub.users?.email || "No email",
        tier: sub.membership_tiers?.title || "Unknown Tier",
        tierPrice: sub.amount_paid || sub.membership_tiers?.price || 0,
        subscriptionDate: sub.created_at,
        avatarUrl: sub.users?.profile_picture || undefined,
        status: sub.status as 'active' | 'expired' | 'pending'
      }));
      
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
        refetchSubscribers();
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [creatorData?.id, queryClient, refetchSubscribers]);

  // Listen for custom subscription events from payment flow
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      console.log('Subscription update event detected, refreshing data...');
      handleManualRefresh();
    };

    // Listen for custom subscription events
    window.addEventListener('subscriptionSuccess', handleSubscriptionUpdate);
    window.addEventListener('paymentSuccess', handleSubscriptionUpdate);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleSubscriptionUpdate);
      window.removeEventListener('paymentSuccess', handleSubscriptionUpdate);
    };
  }, []);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getTierBadgeVariant(tier: string) {
    const tierLower = tier.toLowerCase();
    if (tierLower.includes('exclusive')) return 'default';
    if (tierLower.includes('supporter')) return 'secondary';
    return 'outline';
  }

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
