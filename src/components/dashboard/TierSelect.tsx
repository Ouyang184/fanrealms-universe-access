
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Lock } from "lucide-react";

interface TierSelectProps {
  onSelect: (tierId: string | null) => void;
  value: string | null;
  disabled?: boolean;
}

export function TierSelect({ onSelect, value, disabled }: TierSelectProps) {
  const { user } = useAuth();

  const { data: tiers = [] } = useQuery({
    queryKey: ['membershipTiers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get the creator profile
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (creatorError || !creator) {
        console.log('No creator profile found for user:', user.id);
        return [];
      }
      
      // Then get the membership tiers for this creator
      const { data: tiers, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creator.id)
        .order('price', { ascending: true });
        
      if (error) {
        console.error('Error fetching membership tiers:', error);
        return [];
      }
      
      console.log('Available membership tiers:', tiers);
      return tiers || [];
    },
    enabled: !!user?.id
  });

  const handleValueChange = (selectedValue: string) => {
    console.log('TierSelect value change:', selectedValue);
    
    if (selectedValue === "public") {
      onSelect(null);
    } else {
      onSelect(selectedValue);
    }
  };

  return (
    <Select value={value || "public"} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Choose post visibility" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="public">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-green-600" />
            <span>Public - Free for everyone</span>
          </div>
        </SelectItem>
        {tiers.map((tier) => (
          <SelectItem key={tier.id} value={tier.id}>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-purple-600" />
              <span>{tier.title} - ${tier.price}/month</span>
            </div>
          </SelectItem>
        ))}
        {tiers.length === 0 && (
          <SelectItem value="no-tiers" disabled>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>No membership tiers created yet</span>
            </div>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
