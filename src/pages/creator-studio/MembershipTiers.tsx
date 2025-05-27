
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Tier, CreateTierForm } from "@/components/creator-studio/CreateTierForm";
import { DeleteTierDialog } from "@/components/creator-studio/DeleteTierDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Plus, Trash2, Edit, Users } from "lucide-react";

export default function CreatorStudioTiers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [deletingTier, setDeletingTier] = useState<Tier | null>(null);
  
  // Fetch creator tiers with accurate subscriber counts
  const { data: tiers, isLoading, error } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => {
      if (!user) return [];
      
      // First get the creator ID
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (creatorError) {
        throw new Error("Could not find your creator profile");
      }
      
      console.log('Creator ID:', creatorData.id);
      
      // Then get the tiers for this creator
      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("creator_id", creatorData.id)
        .order("price", { ascending: true });
      
      if (tiersError) throw tiersError;
      
      console.log('Tiers data:', tiersData);
      
      // Count active subscribers for each tier
      const tiersWithSubscribers = await Promise.all(tiersData.map(async (tier) => {
        console.log('Counting subscribers for tier:', tier.id);
        
        // Count from creator_subscriptions table with active status
        const { count, error: countError } = await supabase
          .from('creator_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('tier_id', tier.id)
          .eq('status', 'active');

        if (countError) {
          console.error('Error counting subscribers for tier:', tier.id, countError);
        }

        console.log('Subscriber count for tier', tier.id, ':', count);
        
        return {
          id: tier.id,
          name: tier.title,
          price: tier.price,
          features: tier.description ? tier.description.split("|") : [],
          subscriberCount: count || 0,
        };
      }));
      
      console.log('Final tiers with subscriber counts:', tiersWithSubscribers);
      return tiersWithSubscribers;
    },
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds to keep counts updated
  });
  
  // Set up real-time subscription for creator_subscriptions table
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for subscription changes');
    
    const channel = supabase
      .channel('creator-subscriptions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'creator_subscriptions'
      }, (payload) => {
        console.log('Real-time subscription update received:', payload);
        // Invalidate and refetch the tiers query when subscription changes occur
        queryClient.invalidateQueries({ queryKey: ["tiers"] });
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const queryClient = useQueryClient();
  
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
