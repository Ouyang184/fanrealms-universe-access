
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(false);
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

  // Add a "Public" option at the beginning
  const options = [
    { id: null, title: "Public", description: "Available to everyone", price: 0 },
    ...tiers
  ];

  // Find the currently selected tier
  const selectedTier = options.find(tier => {
    if (tier.id === null && value === null) return true;
    return tier.id === value;
  });

  const isLoading = isLoadingCreator || isLoadingTiers;

  return (
    <Popover open={open && !disabled} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="w-full justify-between"
        >
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : selectedTier ? (
            <div className="flex items-center gap-2">
              {selectedTier.id === null ? (
                "Public"
              ) : (
                <>
                  {selectedTier.title}
                  <Badge variant="outline" className="ml-2">
                    ${Number(selectedTier.price).toFixed(2)}
                  </Badge>
                </>
              )}
            </div>
          ) : (
            "Select visibility..."
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search tiers..." />
          <CommandEmpty>No tier found.</CommandEmpty>
          <CommandGroup>
            {options.map((tier) => (
              <CommandItem
                key={tier.id || "public"}
                value={tier.title}
                onSelect={() => {
                  onSelect(tier.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    (tier.id === null && value === null) || tier.id === value 
                      ? "opacity-100" 
                      : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{tier.title}</span>
                  <span className="text-xs text-muted-foreground">{tier.description}</span>
                </div>
                {tier.id !== null && (
                  <Badge variant="outline" className="ml-auto">
                    ${Number(tier.price).toFixed(2)}
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
