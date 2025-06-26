import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface TierSelectProps {
  onTierSelect: (tierId: string | null) => void;
  selectedTier: string | null;
}

export function TierSelect({ onTierSelect, selectedTier }: TierSelectProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTierTitle, setNewTierTitle] = useState("");
  const [newTierPrice, setNewTierPrice] = useState<number | "">("");
  const { user } = useAuth();

  const { data: creator } = useQuery({
    queryKey: ['creator-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id as any)
        .single();
      
      if (error) {
        console.error('Error fetching creator:', error);
        return null;
      }
      
      return data as any;
    },
    enabled: !!user?.id
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['membership-tiers', (creator as any)?.id],
    queryFn: async () => {
      if (!(creator as any)?.id) return [];
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('id, title, price')
        .eq('creator_id', (creator as any).id)
        .eq('active', true as any)
        .order('price', { ascending: true });
      
      if (error) {
        console.error('Error fetching tiers:', error);
        return [];
      }
      
      return data as any[];
    },
    enabled: !!(creator as any)?.id
  });

  const handleCreateTier = async () => {
    if (!user?.id || !(creator as any)?.id) return;
    
    try {
      setIsCreating(true);
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .insert({
          title: newTierTitle,
          price: newTierPrice,
          description: `${newTierTitle} tier`,
          creator_id: (creator as any).id
        } as any)
        .select('id, title, price')
        .single();
      
      if (error) throw error;
      
      const newTier = data as any;
      
      toast({
        title: "Success",
        description: "New tier created successfully",
      });
      onTierSelect(newTier.id);
      setNewTierTitle("");
      setNewTierPrice("");
      setIsCreating(false);
    } catch (error: any) {
      console.error("Error creating tier:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create tier",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Membership Tier</Label>
      {tiers.map((tier: any) => (
        <div key={(tier as any).id} className="flex items-center space-x-2">
          <input
            type="radio"
            id={`tier-${(tier as any).id}`}
            name="tier"
            value={(tier as any).id}
            checked={selectedTier === (tier as any).id}
            onChange={(e) => onTierSelect(e.target.value)}
            className="w-4 h-4 text-primary"
          />
          <label htmlFor={`tier-${(tier as any).id}`} className="flex-1 cursor-pointer">
            <span className="font-medium">{(tier as any).title}</span>
            <span className="text-muted-foreground ml-2">
              ${(tier as any).price}/month
            </span>
          </label>
        </div>
      ))}
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id="no-tier"
          name="tier"
          value=""
          checked={selectedTier === null}
          onChange={() => onTierSelect(null)}
          className="w-4 h-4 text-primary"
        />
        <label htmlFor="no-tier" className="cursor-pointer">
          Public Post (No Tier)
        </label>
      </div>
      <div className="border-t pt-4">
        <p className="text-sm font-medium">Create New Tier</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="new-tier-title">Title</Label>
            <Input
              type="text"
              id="new-tier-title"
              placeholder="e.g., Gold, VIP"
              value={newTierTitle}
              onChange={(e) => setNewTierTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="new-tier-price">Price</Label>
            <Input
              type="number"
              id="new-tier-price"
              placeholder="e.g., 4.99"
              value={newTierPrice}
              onChange={(e) => setNewTierPrice(Number(e.target.value))}
            />
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleCreateTier}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Creating..." : "Create Tier"}
        </Button>
      </div>
    </div>
  );
}
