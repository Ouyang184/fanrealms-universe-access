
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Lock, Crown } from "lucide-react";

interface Tier {
  id: string;
  title: string;
  price: number;
}

interface TierSelectProps {
  onSelect: (tierIds: string[] | null) => void;
  value: string[] | string | null;
  disabled?: boolean;
}

export function TierSelect({ onSelect, value, disabled = false }: TierSelectProps) {
  const { user } = useAuth();
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);

  // Convert legacy single tier value to array format
  useEffect(() => {
    if (value === null) {
      setSelectedTierIds([]);
    } else if (typeof value === 'string') {
      setSelectedTierIds([value]);
    } else if (Array.isArray(value)) {
      setSelectedTierIds(value);
    }
  }, [value]);

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['creator-tiers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: creatorProfile } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!creatorProfile) return [];
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('id, title, price')
        .eq('creator_id', creatorProfile.id)
        .eq('active', true)
        .order('price', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const handleTierToggle = (tierId: string, checked: boolean) => {
    let newSelectedTierIds: string[];
    
    if (checked) {
      newSelectedTierIds = [...selectedTierIds, tierId];
    } else {
      newSelectedTierIds = selectedTierIds.filter(id => id !== tierId);
    }
    
    setSelectedTierIds(newSelectedTierIds);
    onSelect(newSelectedTierIds.length > 0 ? newSelectedTierIds : null);
  };

  const handlePublicPost = () => {
    setSelectedTierIds([]);
    onSelect(null);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading tiers...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Post Visibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Public option */}
        <div className="flex items-center space-x-3 p-3 rounded-lg border bg-green-50 hover:bg-green-100 transition-colors">
          <Checkbox
            id="public"
            checked={selectedTierIds.length === 0}
            onCheckedChange={handlePublicPost}
            disabled={disabled}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Public Post</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Visible to everyone, including non-subscribers
            </p>
          </div>
        </div>

        {/* Premium tier options */}
        {tiers.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Premium Tiers
            </div>
            {tiers.map((tier) => (
              <div 
                key={tier.id} 
                className="flex items-center space-x-3 p-3 rounded-lg border bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Checkbox
                  id={tier.id}
                  checked={selectedTierIds.includes(tier.id)}
                  onCheckedChange={(checked) => handleTierToggle(tier.id, checked as boolean)}
                  disabled={disabled}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">{tier.title}</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                      ${tier.price}/mo
                    </Badge>
                  </div>
                  <p className="text-xs text-purple-700 mt-1">
                    Only subscribers of this tier can view
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No membership tiers available.</p>
            <p className="text-xs mt-1">Create tiers to offer premium content.</p>
          </div>
        )}

        {/* Selected summary */}
        {selectedTierIds.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Premium Content</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedTierIds.map(tierId => {
                const tier = tiers.find(t => t.id === tierId);
                return tier ? (
                  <Badge key={tierId} variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                    {tier.title}
                  </Badge>
                ) : null;
              })}
            </div>
            <p className="text-xs text-amber-700 mt-2">
              This post will be visible to subscribers of the selected tier(s) only.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
