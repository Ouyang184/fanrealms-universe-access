
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Lock, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

type Tier = {
  id: string;
  title: string;
  description: string;
  price: number;
  creator_id: string;
};

interface TierSelectProps {
  onSelect: (tierId: string | null) => void;
  value?: string | null;
  disabled?: boolean;
}

export function TierSelect({ onSelect, value, disabled = false }: TierSelectProps) {
  const { user } = useAuth();

  // Fetch creator profile to get the creator ID
  const { data: creatorProfile, isLoading: isLoadingCreator } = useQuery({
    queryKey: ['creator-profile-for-tiers', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch tiers
  const { data: tiers = [], isLoading: isLoadingTiers } = useQuery({
    queryKey: ['tier-select-options', creatorProfile?.id],
    queryFn: async () => {
      if (!creatorProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('price', { ascending: true });
        
      if (error) {
        console.error('Error fetching tiers:', error);
        return [];
      }
      
      return data;
    },
    enabled: !!creatorProfile?.id
  });

  // Create options with public first, then tiers ordered by price (lowest to highest)
  const options = [
    { 
      id: null, 
      title: "Public", 
      description: "Available to everyone for free", 
      price: 0,
      isPublic: true 
    },
    ...tiers.map(tier => ({ ...tier, isPublic: false }))
  ];

  // Find the currently selected tier
  const selectedTier = options.find(tier => {
    if (tier.id === null && value === null) return true;
    return tier.id === value;
  });

  const isLoading = isLoadingCreator || isLoadingTiers;

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "public") {
      onSelect(null);
    } else {
      onSelect(selectedValue);
    }
  };

  // Helper function to get access description
  const getAccessDescription = (tier: any, tierIndex: number) => {
    if (tier.isPublic) {
      return "Everyone can view this post";
    }
    
    const higherTiers = options.slice(tierIndex + 1);
    if (higherTiers.length === 0) {
      return `Only ${tier.title} subscribers can view this post`;
    }
    
    const tierNames = [tier.title, ...higherTiers.map(t => t.title)];
    return `${tierNames.join(", ")} subscribers can view this post`;
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Choose minimum tier required to view this post
      </div>
      
      <Select 
        value={value === null ? "public" : value || ""} 
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-full h-auto p-3">
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : selectedTier ? (
            <div className="flex items-center gap-3 text-left w-full">
              <div className="flex-shrink-0">
                {selectedTier.isPublic ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedTier.title}</span>
                  {!selectedTier.isPublic && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      ${Number(selectedTier.price).toFixed(2)}/month
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {selectedTier.description}
                </div>
              </div>
            </div>
          ) : (
            <SelectValue placeholder="Select minimum tier required..." />
          )}
        </SelectTrigger>
        
        <SelectContent className="w-full max-w-[400px]">
          {options.map((tier, index) => (
            <SelectItem
              key={tier.id || "public"}
              value={tier.id || "public"}
              className="p-3"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0">
                  {tier.isPublic ? (
                    <Globe className="h-4 w-4 text-green-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tier.title}</span>
                    {!tier.isPublic && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 ml-2">
                        ${Number(tier.price).toFixed(2)}/month
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {tier.description}
                  </div>
                  <div className="text-xs mt-1 font-medium text-blue-600">
                    {getAccessDescription(tier, index)}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedTier && (
        <div className={cn(
          "p-3 rounded-lg border text-sm",
          selectedTier.isPublic 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-purple-50 border-purple-200 text-purple-800"
        )}>
          <div className="flex items-center gap-2">
            {selectedTier.isPublic ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            <span className="font-medium">
              {selectedTier.isPublic ? "Public Post" : `${selectedTier.title}+ Required`}
            </span>
          </div>
          <div className="mt-1 text-xs opacity-90">
            {selectedTier.isPublic 
              ? "This post will be visible to all visitors and followers."
              : (() => {
                  const selectedIndex = options.findIndex(opt => opt.id === selectedTier.id);
                  const allowedTiers = options.slice(selectedIndex);
                  const tierNames = allowedTiers.map(t => t.title);
                  return `Only subscribers to ${tierNames.join(", ")} can view this post. Higher tier members automatically get access.`;
                })()
            }
          </div>
        </div>
      )}
    </div>
  );
}
