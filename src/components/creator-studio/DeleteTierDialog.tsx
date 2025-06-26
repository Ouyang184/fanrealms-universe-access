
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
  tierTitle: string;
  onDelete?: () => void;
}

export function DeleteTierDialog({ isOpen, onClose, tierId, tierTitle, onDelete }: DeleteTierDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!tierId) return;
    
    setIsDeleting(true);
    
    try {
      // First, check if tier has any active subscriptions
      const { data: activeSubscriptions, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('tier_id', tierId as any)
        .eq('status', 'active' as any);

      if (subscriptionError) {
        console.error('Error checking subscriptions:', subscriptionError);
        throw new Error('Failed to check active subscriptions');
      }

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        toast({
          title: "Cannot delete tier",
          description: `This tier has ${activeSubscriptions.length} active subscriber(s). Please cancel all active subscriptions first.`,
          variant: "destructive",
        });
        return;
      }

      // Update posts that use this tier to remove the tier_id
      const { error: postUpdateError } = await supabase
        .from('posts')
        .update({ tier_id: null } as any)
        .eq('tier_id', tierId as any);

      if (postUpdateError) {
        console.error('Error updating posts:', postUpdateError);
        // Continue with deletion even if post update fails
      }

      // Get tier details for Stripe cleanup
      const { data: tierData, error: tierError } = await supabase
        .from('membership_tiers')
        .select('stripe_product_id, stripe_price_id, title')
        .eq('id', tierId as any)
        .single();

      if (tierData && (tierData as any).stripe_product_id) {
        try {
          const { error: archiveError } = await supabase.functions.invoke('archive-stripe-product', {
            body: { productId: (tierData as any).stripe_product_id }
          });
          
          if (archiveError) {
            console.error('Error archiving Stripe product:', archiveError);
          }
        } catch (stripeError) {
          console.error('Stripe archive error:', stripeError);
          // Continue with deletion even if Stripe cleanup fails
        }
      }

      // Finally, delete the tier
      const { error: deleteError } = await supabase
        .from('membership_tiers')
        .delete()
        .eq('id', tierId as any);

      if (deleteError) throw deleteError;

      toast({
        title: "Tier deleted",
        description: `${tierTitle} has been successfully deleted.`,
      });

      // Refresh the tiers list
      queryClient.invalidateQueries({ queryKey: ['creator-tiers'] });
      
      onDelete?.();
      onClose();
      
    } catch (error: any) {
      console.error('Error deleting tier:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete tier. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Membership Tier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete the "{tierTitle}" tier? This action cannot be undone.
            <p className="mt-2 text-destructive font-medium">
              Warning: This will completely remove the tier from both Stripe and your database. Any posts associated with this tier will be made public.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              If there are active subscriptions for this tier, you'll need to cancel them first before deleting.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading || isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading || isDeleting ? (
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
