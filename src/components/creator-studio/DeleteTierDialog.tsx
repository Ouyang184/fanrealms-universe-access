
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader } from "lucide-react";

export interface DeleteTierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tierId: string;
  tierName: string;
}

export function DeleteTierDialog({ isOpen, onClose, tierId, tierName }: DeleteTierDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!tierId) return;
    
    setIsLoading(true);
    
    try {
      // First, get the tier details including Stripe IDs
      const { data: tierData, error: tierFetchError } = await supabase
        .from("membership_tiers")
        .select("stripe_product_id, stripe_price_id, title")
        .eq("id", tierId)
        .single();

      if (tierFetchError) {
        throw new Error("Could not fetch tier details");
      }

      console.log('Deleting tier:', tierData);

      // Check if there are active subscriptions for this tier
      const { data: activeSubscriptions, error: subscriptionsError } = await supabase
        .from("user_subscriptions")
        .select("id, stripe_subscription_id")
        .eq("tier_id", tierId)
        .eq("status", "active");

      if (subscriptionsError) {
        console.error('Error checking subscriptions:', subscriptionsError);
      }

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        toast({
          title: "Cannot Delete Tier",
          description: `This tier has ${activeSubscriptions.length} active subscriber(s). Please cancel all subscriptions before deleting the tier.`,
          variant: "destructive",
        });
        return;
      }

      // If there's a Stripe product, archive it instead of deleting
      if (tierData.stripe_product_id) {
        try {
          console.log('Archiving Stripe product:', tierData.stripe_product_id);
          
          const { error: stripeError } = await supabase.functions.invoke('archive-stripe-product', {
            body: { 
              productId: tierData.stripe_product_id,
              priceId: tierData.stripe_price_id
            }
          });

          if (stripeError) {
            console.error('Error archiving Stripe product:', stripeError);
            // Continue with database deletion even if Stripe archiving fails
            toast({
              title: "Warning",
              description: "Tier deleted from database, but Stripe product could not be archived. You may need to manually archive it in Stripe.",
              variant: "destructive",
            });
          }
        } catch (stripeError) {
          console.error('Error with Stripe cleanup:', stripeError);
          // Continue with database deletion
        }
      }

      // Delete the tier from database
      const { error: deleteError } = await supabase
        .from("membership_tiers")
        .delete()
        .eq("id", tierId);
      
      if (deleteError) throw deleteError;
      
      // Show success message
      toast({
        description: `"${tierName}" tier has been deleted successfully.`,
      });
      
      // Refresh tiers data
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
      
      // Close the dialog
      onClose();
      
    } catch (error: any) {
      console.error('Tier deletion error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete tier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Membership Tier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the "{tierName}" tier? This action cannot be undone.
            <p className="mt-2 text-destructive font-medium">
              Warning: This will also archive the associated Stripe product. Any active subscribers will lose access to their benefits.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              If there are active subscriptions for this tier, you'll need to cancel them first before deleting.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Tier"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
