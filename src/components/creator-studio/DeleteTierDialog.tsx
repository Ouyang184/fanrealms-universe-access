
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
      console.log('Starting tier deletion process for tier:', tierId);

      // First, get the tier details including Stripe IDs
      const { data: tierData, error: tierFetchError } = await supabase
        .from("membership_tiers")
        .select("stripe_product_id, stripe_price_id, title")
        .eq("id", tierId)
        .single();

      if (tierFetchError) {
        throw new Error("Could not fetch tier details");
      }

      console.log('Tier data to delete:', tierData);

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

      // Check if there are posts associated with this tier
      const { data: associatedPosts, error: postsError } = await supabase
        .from("posts")
        .select("id, title")
        .eq("tier_id", tierId);

      if (postsError) {
        console.error('Error checking posts:', postsError);
      }

      // If there are posts, remove the tier association from them
      if (associatedPosts && associatedPosts.length > 0) {
        console.log(`Found ${associatedPosts.length} posts associated with this tier. Removing tier association...`);
        
        const { error: updatePostsError } = await supabase
          .from("posts")
          .update({ tier_id: null })
          .eq("tier_id", tierId);

        if (updatePostsError) {
          console.error('Error updating posts:', updatePostsError);
          throw new Error("Failed to remove tier association from posts");
        }

        console.log('Successfully removed tier association from posts');
      }

      // Delete from Stripe first (completely, not just archive)
      if (tierData.stripe_product_id) {
        try {
          console.log('Deleting Stripe product completely:', tierData.stripe_product_id);
          
          const { error: stripeError } = await supabase.functions.invoke('delete-stripe-product', {
            body: { 
              productId: tierData.stripe_product_id
            }
          });

          if (stripeError) {
            console.error('Error deleting Stripe product:', stripeError);
            // Continue with database deletion even if Stripe deletion fails
            toast({
              title: "Warning",
              description: "Tier deleted from database, but Stripe product could not be completely removed. You may need to manually delete it in Stripe.",
              variant: "destructive",
            });
          } else {
            console.log('Stripe product deleted successfully');
          }
        } catch (stripeError) {
          console.error('Error with Stripe deletion:', stripeError);
          // Continue with database deletion
        }
      }

      // Delete the tier from database completely
      console.log('Deleting tier from database:', tierId);
      const { error: deleteError } = await supabase
        .from("membership_tiers")
        .delete()
        .eq("id", tierId);
      
      if (deleteError) {
        console.error('Database deletion error:', deleteError);
        throw deleteError;
      }
      
      console.log('Tier deleted from database successfully');

      // Show success message
      toast({
        description: `"${tierName}" tier has been completely deleted.`,
      });
      
      // Aggressively refresh all related data
      console.log('Refreshing frontend data...');
      await queryClient.invalidateQueries({ queryKey: ["tiers"] });
      await queryClient.refetchQueries({ queryKey: ["tiers"] });
      
      // Also invalidate any creator-related queries
      await queryClient.invalidateQueries({ queryKey: ["creator-tiers"] });
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      
      // Force a small delay to ensure backend sync
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["tiers"] });
      }, 1000);
      
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
            Are you sure you want to permanently delete the "{tierName}" tier? This action cannot be undone.
            <p className="mt-2 text-destructive font-medium">
              Warning: This will completely remove the tier from both Stripe and your database. Any posts associated with this tier will be made public.
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
              "Delete Permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
