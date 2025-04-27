
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { DbMembershipTier } from "@/types";

interface TierSelectProps {
  onSelect: (tierId: string | null) => void;
  value?: string | null;
  disabled?: boolean;
}

export function TierSelect({ onSelect, value, disabled }: TierSelectProps) {
  const { user } = useAuth();
  
  const { data: tiers = [] } = useQuery({
    queryKey: ['creator-tiers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: creatorData } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!creatorData?.id) return [];
      
      const { data: tiers } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', creatorData.id);
        
      return tiers || [];
    },
    enabled: !!user?.id
  });

  return (
    <Select
      value={value || "public"}
      onValueChange={(val) => onSelect(val === "public" ? null : val)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select visibility" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="public">Public</SelectItem>
          {tiers.map((tier: DbMembershipTier) => (
            <SelectItem key={tier.id} value={tier.id}>
              {tier.title} ({tier.price} credits)
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
