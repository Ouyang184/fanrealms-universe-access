
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface SwitchTierButtonProps {
  tierId: string;
  tierTitle: string;
  tierPrice: number;
  creatorId: string;
  currentSubscription: any;
  onSuccess: () => void;
}

export function SwitchTierButton({ 
  tierId, 
  tierTitle, 
  tierPrice, 
  creatorId, 
  currentSubscription,
  onSuccess 
}: SwitchTierButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSwitchTier = async () => {
    if (!currentSubscription) return;

    setIsProcessing(true);
    
    try {
      console.log('Switching tier from', currentSubscription.tier?.title, 'to', tierTitle);
      
      // Call the simple-subscriptions function to handle tier switching
      const { data, error } = await supabase.functions.invoke('simple-subscriptions', {
        body: {
          action: 'switch_tier',
          currentSubscriptionId: currentSubscription.id,
          newTierId: tierId,
          creatorId: creatorId
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        toast({
          title: "Switch Failed",
          description: data.error,
          variant: "destructive"
        });
        return;
      }

      if (data?.checkoutUrl) {
        // Redirect to Stripe Checkout for proration handling
        window.open(data.checkoutUrl, '_blank');
        
        toast({
          title: "Redirecting to Stripe",
          description: `Switching to ${tierTitle} - complete your payment to finish the tier switch.`,
        });
      }

    } catch (error) {
      console.error('Error switching tier:', error);
      toast({
        title: "Switch Failed",
        description: error instanceof Error ? error.message : 'Failed to switch tier',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleSwitchTier}
      disabled={isProcessing}
      variant="outline"
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Switching...
        </>
      ) : (
        `Switch to ${tierTitle}`
      )}
    </Button>
  );
}
