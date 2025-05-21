
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { SubscriberWithDetails } from "@/types/creator-studio";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SubscriberHeader } from "@/components/creator-studio/subscribers/SubscriberHeader";
import { SubscriberStatsCards } from "@/components/creator-studio/subscribers/SubscriberStatsCards";
import { SubscriberSearch } from "@/components/creator-studio/subscribers/SubscriberSearch";
import { SubscribersTable } from "@/components/creator-studio/subscribers/SubscribersTable";
import { useToast } from "@/hooks/use-toast";

export default function CreatorStudioSubscribers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [subscribers, setSubscribers] = useState<SubscriberWithDetails[]>([]);

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

  // Fetch subscribers
  const { isLoading: loadingSubscribers } = useQuery({
    queryKey: ["subscribers", creatorData?.id],
    queryFn: async () => {
      if (!creatorData?.id) return [];
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          created_at,
          tier_id,
          is_paid,
          users!subscriptions_user_id_fkey(
            id,
            email,
            username,
            profile_picture
          ),
          membership_tiers(
            id,
            title,
            price
          )
        `)
        .eq("creator_id", creatorData.id);
      
      if (error) {
        console.error("Error fetching subscribers:", error);
        toast({
          title: "Error",
          description: "Could not fetch subscribers",
          variant: "destructive"
        });
        return [];
      }
      
      // Transform the data to match SubscriberWithDetails format
      const formattedSubscribers: SubscriberWithDetails[] = data.map((sub: any) => ({
        id: sub.id,
        name: sub.users?.username || "Unknown User",
        email: sub.users?.email || "No email",
        tier: sub.membership_tiers?.title || (sub.is_paid ? "Paid Tier" : "Free Tier"),
        tierPrice: sub.membership_tiers?.price || 0,
        subscriptionDate: sub.created_at,
        avatarUrl: sub.users?.profile_picture || undefined
      }));
      
      setSubscribers(formattedSubscribers);
      return formattedSubscribers;
    },
    enabled: !!creatorData?.id
  });

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
        <SubscriberHeader />
        
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
