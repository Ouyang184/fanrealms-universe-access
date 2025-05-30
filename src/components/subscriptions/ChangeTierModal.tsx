
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Crown, Check } from "lucide-react";
import { getTierColor } from "@/utils/tierColors";

interface ChangeTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: any;
  onSuccess: () => void;
}

export function ChangeTierModal({ isOpen, onClose, subscription, onSuccess }: ChangeTierModalProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Fetch available tiers for this creator
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['creatorTiers', subscription?.creator_id],
    queryFn: async () => {
      if (!subscription?.creator_id) return [];
      
      const { data, error } = await supabase
        .from('membership_tiers')
        .select('*')
        .eq('creator_id', subscription.creator_id)
        .order('price', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!subscription?.creator_id && isOpen
  });

  const handleChangeTier = async () => {
    if (!selectedTierId || !subscription) return;

    const selectedTier = tiers.find(tier => tier.id === selectedTierId);
    if (!selectedTier) return;

    setIsUpdating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'change_tier',
          subscriptionId: subscription.id,
          newTierId: selectedTierId,
          creatorId: subscription.creator_id
        }
      });

      if (error) throw error;

      toast({
        title: "Tier changed successfully!",
        description: `You've switched to ${selectedTier.title} for $${selectedTier.price}/month.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error changing tier:', error);
      toast({
        title: "Error changing tier",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentTier = tiers.find(tier => tier.id === subscription?.tier_id);
  const selectedTier = tiers.find(tier => tier.id === selectedTierId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Subscription Tier</DialogTitle>
          <DialogDescription>
            Choose a new tier for your subscription to {subscription?.creator?.display_name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Tier Info */}
            {currentTier && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Current Tier</span>
                </div>
                <p className="text-sm text-blue-700">
                  {currentTier.title} - ${currentTier.price}/month
                </p>
              </div>
            )}

            {/* Available Tiers */}
            <div className="grid gap-3">
              {tiers.map((tier) => {
                const isCurrentTier = tier.id === subscription?.tier_id;
                const isSelected = tier.id === selectedTierId;
                
                return (
                  <Card 
                    key={tier.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${isCurrentTier ? 'opacity-60' : ''}`}
                    onClick={() => !isCurrentTier && setSelectedTierId(tier.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{tier.title}</CardTitle>
                          <Badge className={getTierColor(tier.title)}>
                            ${tier.price}/mo
                          </Badge>
                          {isCurrentTier && (
                            <Badge variant="secondary">Current</Badge>
                          )}
                          {isSelected && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Billing Info */}
            {selectedTier && currentTier && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Billing Changes</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>Current: ${currentTier.price}/month</p>
                  <p>New: ${selectedTier.price}/month</p>
                  <p className="font-medium">
                    {selectedTier.price > currentTier.price ? 'Upgrade' : 'Downgrade'} will be prorated and take effect immediately.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button 
            onClick={handleChangeTier} 
            disabled={!selectedTierId || isUpdating || selectedTierId === subscription?.tier_id}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Change Tier'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
