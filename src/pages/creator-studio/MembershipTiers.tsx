
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { CreateTierForm } from "@/components/creator-studio/CreateTierForm";
import { DeleteTierDialog } from "@/components/creator-studio/DeleteTierDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Plus, Trash2, Edit, Users } from "lucide-react";
import { useOptimizedRealtime } from "@/hooks/useOptimizedRealtime";

// Define Tier interface locally since it's not exported from CreateTierForm
export interface Tier {
  id: string;
  name: string;
  price: number;
  features: string[];
  subscriberCount: number;
}

export default function CreatorStudioTiers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [deletingTier, setDeletingTier] = useState<Tier | null>(null);
  
  // Fetch creator tiers with accurate subscriber counts
  const { data: tiers, isLoading, error, refetch } = useQuery({
    queryKey: ["tiers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('[MembershipTiers] Fetching tiers for user:', user.id);
      
      // First get the creator ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id as any)
        .single();
      
      if (creatorError) {
        console.error('[MembershipTiers] Error finding creator profile:', creatorError);
        throw new Error("Could not find your creator profile");
      }
      
      if (!creatorData) {
        console.log('[MembershipTiers] No creator data found');
        return [];
      }
      
      console.log('[MembershipTiers] Creator ID:', creatorData.id);
      
      // Then get the tiers for this creator
      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("creator_id", creatorData.id as any)
        .eq("active", true as any)
        .order("price", { ascending: true });
      
      if (tiersError) {
        console.error('[MembershipTiers] Error fetching tiers:', tiersError);
        throw tiersError;
      }
      
      console.log('[MembershipTiers] Tiers data:', tiersData);
      
      if (!tiersData || !Array.isArray(tiersData)) {
        return [];
      }
      
      // Count active subscribers for each tier using the user_subscriptions table
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        console.log('[MembershipTiers] Counting subscribers for tier:', tier.id, tier.title);
        
        try {
          // Count from user_subscriptions table with active status only
          const { count, error: countError } = await supabase
            .from('user_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('tier_id', tier.id as any)
            .eq('creator_id', creatorData.id as any)
            .eq('status', 'active' as any);

          if (countError) {
            console.error('[MembershipTiers] Error counting subscribers for tier:', tier.id, countError);
            return {
              id: tier.id,
              name: tier.title,
              price: tier.price,
              features: tier.description ? tier.description.split("|").filter(f => f.trim()) : [],
              subscriberCount: 0,
            };
          }

          const subscriberCount = count || 0;
          console.log('[MembershipTiers] Tier', tier.title, 'has', subscriberCount, 'active subscribers');
          
          return {
            id: tier.id,
            name: tier.title,
            price: tier.price,
            features: tier.description ? tier.description.split("|").filter(f => f.trim()) : [],
            subscriberCount,
          };
        } catch (error) {
          console.error('[MembershipTiers] Error processing tier:', tier.id, error);
          return {
            id: tier.id,
            name: tier.title,
            price: tier.price,
            features: tier.description ? tier.description.split("|").filter(f => f.trim()) : [],
            subscriberCount: 0,
          };
        }
      }));
      
      console.log('[MembershipTiers] Final tiers with subscriber counts:', tiersWithSubscribers);
      return tiersWithSubscribers;
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute to reduce queries
    refetchInterval: false, // Disable auto-refetch to reduce load
  });

  // Optimized realtime subscription for tier changes
  useOptimizedRealtime({
    table: 'membership_tiers',
    event: '*',
    callback: () => {
      console.log('[MembershipTiers] Tier change detected, refreshing...');
      queryClient.invalidateQueries({ queryKey: ["tiers", user?.id] });
    },
    enabled: !!user,
    debounceMs: 3000 // Increased debounce to reduce load
  });

  // Optimized realtime subscription for subscription changes
  useOptimizedRealtime({
    table: 'user_subscriptions',
    event: '*',
    callback: () => {
      console.log('[MembershipTiers] Subscription change detected, refreshing...');
      queryClient.invalidateQueries({ queryKey: ["tiers", user?.id] });
    },
    enabled: !!user,
    debounceMs: 3000 // Increased debounce to reduce load
  });

  // Listen for subscription events and tier deletion events (reduced frequency)
  useEffect(() => {
    const handleDataUpdate = async () => {
      console.log('[MembershipTiers] Data update event detected, refreshing...');
      
      // Use requestIdleCallback to avoid blocking
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          queryClient.invalidateQueries({ queryKey: ["tiers", user?.id] });
        });
      } else {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["tiers", user?.id] });
        }, 1000);
      }
    };

    // Reduced event listeners
    const events = ['subscriptionSuccess', 'tierDeleted'];
    
    events.forEach(eventType => {
      window.addEventListener(eventType, handleDataUpdate);
    });
    
    return () => {
      events.forEach(eventType => {
        window.removeEventListener(eventType, handleDataUpdate);
      });
    };
  }, [queryClient, user?.id]);
  
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
    
    // Force refresh after closing dialog (with delay to reduce load)
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["tiers", user?.id] });
    }, 1000);
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
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Tier
        </Button>
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
                    <span>{tier.subscriberCount} subscribers</span>
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
      
      {/* Delete Tier Dialog - Fixed props */}
      <DeleteTierDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        tierId={deletingTier?.id || ""}
        tierTitle={deletingTier?.name || ""}
      />
    </div>
  );
}
