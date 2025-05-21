
import { useState } from "react";
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

export default function CreatorStudioSubscribers() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [subscribers, setSubscribers] = useState<SubscriberWithDetails[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      tier: 'Supporter Tier',
      tierPrice: 15,
      subscriptionDate: '2025-03-15T10:30:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=1'
    },
    {
      id: '2',
      name: 'Jamie Smith',
      email: 'jamie.smith@example.com',
      tier: 'Exclusive Tier',
      tierPrice: 30,
      subscriptionDate: '2025-03-20T14:15:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=2'
    },
    {
      id: '3',
      name: 'Taylor Wilson',
      email: 'taylor.w@example.com',
      tier: 'Basic Tier',
      tierPrice: 5,
      subscriptionDate: '2025-03-22T09:45:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=3'
    },
    {
      id: '4',
      name: 'Jordan Lee',
      email: 'j.lee@example.com',
      tier: 'Supporter Tier',
      tierPrice: 15,
      subscriptionDate: '2025-03-25T16:20:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=4'
    },
    {
      id: '5',
      name: 'Casey Rivera',
      email: 'c.rivera@example.com',
      tier: 'Basic Tier',
      tierPrice: 5,
      subscriptionDate: '2025-04-01T11:10:00Z',
      avatarUrl: 'https://i.pravatar.cc/150?u=5'
    },
  ]);

  // Fetch creator tiers
  const { data: tiers = [] } = useQuery({
    queryKey: ["subscriber-tiers"],
    queryFn: async () => {
      if (!user) return [];
      
      // First get the creator ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (creatorError) {
        console.error("Could not find creator profile:", creatorError);
        return [];
      }
      
      // Then get the tiers for this creator
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("creator_id", creatorData.id)
        .order("price", { ascending: true });
      
      if (error) {
        console.error("Error fetching tiers:", error);
        return [];
      }
      
      return data.map(tier => ({
        id: tier.id,
        name: tier.title,
        price: tier.price
      }));
    },
    enabled: !!user
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
          />
        </Card>
      </div>
    </CreatorCheck>
  );
}
