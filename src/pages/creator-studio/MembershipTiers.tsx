
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Tier, CreateTierForm } from "@/components/creator-studio/CreateTierForm";
import { DeleteTierDialog } from "@/components/creator-studio/DeleteTierDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Plus, Trash2, Edit, Users, RefreshCw } from "lucide-react";

export default function CreatorStudioTiers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [deletingTier, setDeletingTier] = useState<Tier | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch creator tiers with accurate subscriber counts using the same method as the dashboard
  const { data: tiers, isLoading, error, refetch } = useQuery({
    queryKey: ["tiers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('[MembershipTiers] Fetching tiers for user:', user.id);
      
      // First get the creator ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (creatorError) {
        console.error('[MembershipTiers] Error finding creator profile:', creatorError);
        throw new Error("Could not find your creator profile");
      }
      
      console.log('[MembershipTiers] Creator ID:', creatorData.id);
      
      // Then get the tiers for this creator
      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("creator_id", creatorData.id)
        .eq("active", true)
        .order("price", { ascending: true });
      
      if (tiersError) {
        console.error('[MembershipTiers] Error fetching tiers:', tiersError);
        throw tiersError;
      }
      
      console.log('[MembershipTiers] Tiers data:', tiersData);
      
      // Use the same method as useCreatorSubscribers - call the edge function
      const { data: subscribersData, error: subscribersError } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'get_creator_subscribers',
          creatorId: creatorData.id
        }
      });

      if (subscribersError) {
        console.error('[MembershipTiers] Error fetching subscribers:', subscribersError);
        // Continue with empty array if query fails
      }

      console.log('[MembershipTiers] Subscribers data from edge function:', subscribersData?.subscribers?.length || 0);
      
      // Count subscribers by tier using the edge function data
      const subscribersByTier = (subscribersData?.subscribers || []).reduce((acc: Record<string, number>, sub: any) => {
        if (sub.status === 'active') {
          acc[sub.tier_id] = (acc[sub.tier_id] || 0) + 1;
        }
        return acc;
      }, {});
      
      console.log('[MembershipTiers] Subscribers by tier from edge function:', subscribersByTier);
      
      const tiersWithSubscribers = (tiersData || []).map((tier) => {
        const subscriberCount = subscribersByTier[tier.id] || 0;
        
        console.log(`[MembershipTiers] Tier ${tier.title}: ${subscriberCount} subscribers`);
        
        return {
          id: tier.id,
          name: tier.title,
          price: tier.price,
          features: tier.description ? tier.description.split("|").filter(f => f.trim()) : [],
          subscriberCount,
        };
      });
      
      console.log('[MembershipTiers] Final tiers with subscriber counts:', tiersWithSubscribers);
      return tiersWithSubscribers;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds to keep counts updated
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Manual refresh function with explicit sync
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First get the creator ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user?.id)
        .single();
      
      if (creatorError) {
        throw new Error("Could not find your creator profile");
      }

      // Call the explicit sync action
      console.log('[MembershipTiers] Triggering explicit sync for creator:', creatorData.id);
      
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'sync_subscription_counts',
          creatorId: creatorData.id
        }
      });

      if (syncError) {
        console.error('[MembershipTiers] Sync error:', syncError);
        throw syncError;
      }

      console.log('[MembershipTiers] Sync result:', syncResult);

      // Then invalidate and refetch local data
      await queryClient.invalidateQueries({ queryKey: ["tiers"] });
      await refetch();
      
      toast({
        title: "Sync completed successfully",
        description: `Updated ${syncResult?.subscribers?.length || 0} subscriber records`,
      });
    } catch (error) {
      console.error('[MembershipTiers] Sync failed:', error);
      toast({
        title: "Sync failed",
        description: "Failed to sync with Stripe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Listen for subscription events and tier deletion events
  useEffect(() => {
    const handleDataUpdate = async () => {
      console.log('[MembershipTiers] Data update event detected, refreshing...');
      
      // Invalidate and refetch queries immediately
      await queryClient.invalidateQueries({ queryKey: ["tiers"] });
      await refetch();
    };

    // Listen for custom subscription events
    window.addEventListener('subscriptionSuccess', handleDataUpdate);
    window.addEventListener('paymentSuccess', handleDataUpdate);
    window.addEventListener('subscriptionCanceled', handleDataUpdate);
    window.addEventListener('tierDeleted', handleDataUpdate);
    
    return () => {
      window.removeEventListener('subscriptionSuccess', handleDataUpdate);
      window.removeEventListener('paymentSuccess', handleDataUpdate);
      window.removeEventListener('subscriptionCanceled', handleDataUpdate);
      window.removeEventListener('tierDeleted', handleDataUpdate);
    };
  }, [queryClient, refetch]);
  
  // Set up real-time subscription for membership_tiers and user_subscriptions changes
  useEffect(() => {
    if (!user) return;

    console.log('[MembershipTiers] Setting up real-time subscription for tier and subscription changes');
    
    const channel = supabase
      .channel('membership-tiers-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'membership_tiers'
      }, (payload) => {
        console.log('[MembershipTiers] Real-time tier update received:', payload);
        queryClient.invalidateQueries({ queryKey: ["tiers"] });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions'
      }, (payload) => {
        console.log('[MembershipTiers] Real-time subscription update received:', payload);
        queryClient.invalidateQueries({ queryKey: ["tiers"] });
      })
      .subscribe();

    return () => {
      console.log('[MembershipTiers] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
  
  const handleEditTier = (tier: Tier) => {
    setEditingTier(tier);
    setIsCreateModalOpen(true);
  };
  
  const handleDeleteTier = (tier: Tier) => {
    setDeletingTier(tier);
    setIsDeleteDialogOpen(true);
  };
  
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setEditingTier(null);
  };
  
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingTier(null);
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('tierDeleted'));
    
    // Force refresh after closing dialog
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
      refetch();
    }, 500);
  };
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/20 text-destructive p-4 rounded-md">
          Error loading membership tiers: {(error as Error).message}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Membership Tiers</h1>
          <p className="text-muted-foreground">Create and manage your membership tiers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Sync Counts'}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create New Tier
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : tiers && tiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <Card key={tier.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle>{tier.name}</CardTitle>
                  </div>
                  <div className="text-xl font-bold">${tier.price}/mo</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-primary">{tier.subscriberCount} subscribers</span>
                  </div>
                  
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handleEditTier(tier)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTier(tier)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Membership Tiers</CardTitle>
            <CardDescription>You haven't created any membership tiers yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create your first membership tier to start offering exclusive content to your subscribers.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Tier
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Create/Edit Tier Modal */}
      <CreateTierForm 
        isOpen={isCreateModalOpen} 
        onClose={closeCreateModal} 
        editingTier={editingTier} 
      />
      
      {/* Delete Tier Dialog */}
      <DeleteTierDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        tierId={deletingTier?.id || ""}
        tierName={deletingTier?.name || ""}
      />
    </div>
  );
}
