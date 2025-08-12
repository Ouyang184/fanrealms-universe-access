
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { useSimpleSubscriptionCheck } from "@/hooks/useSimpleSubscriptionCheck";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types";
import { useCreateSubscription } from "@/hooks/stripe/useCreateSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TierAccessInfoProps {
  post: Post;
  creatorInfo?: any;
}

export const TierAccessInfo: React.FC<TierAccessInfoProps> = ({ post, creatorInfo }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createSubscription, isProcessing } = useCreateSubscription();
  const { subscriptionData } = useSimpleSubscriptionCheck(post.tier_id || undefined, post.authorId);
  
  // Fetch the specific tier information for this post
  const { data: tierInfo } = useQuery({
    queryKey: ['tier-info', post.tier_id, post.authorId],
    queryFn: async () => {
      if (!post.tier_id || !post.authorId) return null;
      const { data, error } = await supabase
        .rpc('get_public_membership_tiers', { p_creator_id: post.authorId });
      if (error) {
        console.error('Error fetching tier info (public RPC):', error);
        return null;
      }
      return (data || []).find((t: any) => t.id === post.tier_id) || null;
    },
    enabled: !!post.tier_id && !!post.authorId,
  });

  // Fetch all tiers for this creator to show upgrade path
  const { data: creatorTiers } = useQuery({
    queryKey: ['creator-tiers', post.authorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_public_membership_tiers', { p_creator_id: post.authorId });
      
      if (error) {
        console.error('Error fetching creator tiers (public RPC):', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!post.authorId,
  });

  // Check if user has access to this tier
  const hasAccess = subscriptionData?.isSubscribed || false;
  
  // If no tier required or user has access, don't show unlock section
  if (!post.tier_id || hasAccess) {
    return null;
  }

  // Find tiers that grant access (current tier and higher)
  const accessTiers = creatorTiers?.filter(tier => 
    tierInfo && tier.price >= tierInfo.price
  ) || [];

  // Get the lowest tier that grants access (should be the post's tier)
  const lowestAccessTier = accessTiers.length > 0 ? accessTiers[0] : tierInfo;

  if (!tierInfo) {
    return null;
  }

  // Format tier prices for display
  const tierPricesText = accessTiers.length > 1 
    ? `$${accessTiers.map(tier => tier.price).join(', $')} tiers`
    : `$${tierInfo.price} tier`;

  const handleUnlockTier = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to creators.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating subscription for tier:', lowestAccessTier?.id, 'creator:', creatorInfo?.id);
      
      const result = await createSubscription({ 
        tierId: lowestAccessTier?.id || tierInfo.id, 
        creatorId: creatorInfo?.id || post.authorId 
      });
      
      if (result?.error) {
        console.error('Subscription error:', result.error);
        toast({
          title: "Subscription Failed",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      // The createSubscription hook handles navigation to payment page
      
    } catch (error) {
      console.error('Unlock tier error:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-purple-800 mb-1">
            Posted for {tierPricesText}
          </p>
          <p className="text-xs text-purple-600">
            Premium content available to subscribers
          </p>
        </div>
        <Button
          size="sm"
          className="bg-pink-500 hover:bg-pink-600 text-white"
          onClick={handleUnlockTier}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Unlock ${lowestAccessTier?.price || tierInfo.price}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
