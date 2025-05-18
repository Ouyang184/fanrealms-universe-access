
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
      // Delete the tier
      const { error } = await supabase
        .from("membership_tiers")
        .delete()
        .eq("id", tierId);
      
      if (error) throw error;
      
      // Show success message
      toast({
        description: `"${tierName}" tier has been deleted.`,
      });
      
      // Refresh tiers data
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
      
      // Close the dialog
      onClose();
      
    } catch (error: any) {
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
            {tierId && (
              <p className="mt-2 text-destructive">
                Warning: Any subscribers to this tier will lose their benefits.
              </p>
            )}
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
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
