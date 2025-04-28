
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { Plus, Pencil, Trash } from "lucide-react";
import { CreatorCheck } from "@/components/creator-studio/CreatorCheck";
import { CreateTierForm } from "@/components/creator-studio/CreateTierForm";
import { DeleteTierDialog } from "@/components/creator-studio/DeleteTierDialog";
import { Tier } from "@/types";

export default function CreatorStudioTiers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [deletingTier, setDeletingTier] = useState<{id: string, name: string} | null>(null);

  const { 
    data: tiers = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["tiers"],
    queryFn: async () => {
      if (!user) return [];

      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (creatorError) {
        console.error("Error fetching creator:", creatorError);
        return [];
      }

      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select(`
          id,
          title,
          price,
          description,
          created_at,
          subscriptions:subscriptions(count)
        `)
        .eq("creator_id", creatorData.id)
        .order("price", { ascending: true });
      
      if (tiersError) {
        console.error("Error fetching tiers:", tiersError);
        return [];
      }
      
      return tiersData.map(tier => ({
        id: tier.id,
        title: tier.title, // Map directly from title instead of name
        price: tier.price,
        description: tier.description || "", // Provide empty string as fallback
        created_at: tier.created_at || new Date().toISOString(), // Provide current timestamp as fallback
        features: tier.description ? tier.description.split("|") : [],
        subscriberCount: tier.subscriptions[0]?.count || 0
      }));
    },
    enabled: !!user,
  });

  if (error) {
    toast({
      title: "Failed to load tiers",
      description: "There was an error loading your membership tiers.",
      variant: "destructive",
    });
  }

  function handleCreateTier() {
    setEditingTier(null);
    setIsCreateModalOpen(true);
  }

  function handleEditTier(tier: Tier) {
    setEditingTier(tier);
    setIsCreateModalOpen(true);
  }

  function handleDeleteTier(tier: Tier) {
    setDeletingTier({id: tier.id, name: tier.name});
    setIsDeleteDialogOpen(true);
  }

  return (
    <CreatorCheck>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Membership Tiers</h1>
          <Button onClick={handleCreateTier}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Tier
          </Button>
        </div>
        
        <Card>
          <Table>
            <TableCaption>A list of your membership tiers</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Subscribers</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Loading tiers...
                  </TableCell>
                </TableRow>
              ) : tiers.length > 0 ? (
                tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.title}</TableCell>
                    <TableCell>${tier.price}/month</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tier.features.slice(0, 2).map((feature, i) => (
                          <Badge key={i} variant="outline">{feature}</Badge>
                        ))}
                        {tier.features.length > 2 && (
                          <Badge variant="outline">+{tier.features.length - 2} more</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tier.subscriberCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEditTier(tier)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteTier(tier)}>
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No membership tiers found. Create your first tier!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
        
        <CreateTierForm 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          editingTier={editingTier}
        />
        
        {deletingTier && (
          <DeleteTierDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            tierId={deletingTier.id}
            tierName={deletingTier.name}
          />
        )}
      </div>
    </CreatorCheck>
  );
}
