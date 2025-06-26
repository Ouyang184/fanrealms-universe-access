
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { TierFormFields } from "./TierFormFields";
import { useTierForm, Tier } from "@/hooks/useTierForm";

interface TierFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingTier?: Tier | null;
}

export function TierFormDialog({ isOpen, onClose, editingTier }: TierFormDialogProps) {
  const { form, isLoading, onSubmit } = useTierForm({ 
    editingTier, 
    onClose,
    tierId: editingTier?.id
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTier ? "Edit Membership Tier" : "Create New Tier"}</DialogTitle>
          <DialogDescription>
            {editingTier 
              ? "Update the details of your membership tier."
              : "Define a new membership tier for your subscribers."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <TierFormFields form={form as any} />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {editingTier ? "Save Changes" : "Create Tier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
