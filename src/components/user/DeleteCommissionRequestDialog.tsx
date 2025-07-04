
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
import { AlertTriangle } from "lucide-react";

interface DeleteCommissionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
  requestTitle: string;
  hasPaymentSession?: boolean;
}

export function DeleteCommissionRequestDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  isDeleting,
  requestTitle,
  hasPaymentSession = false
}: DeleteCommissionRequestDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasPaymentSession && <AlertTriangle className="h-5 w-5 text-orange-500" />}
            Delete Commission Request
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Are you sure you want to delete "{requestTitle}"?</p>
            {hasPaymentSession && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800">
                <p className="font-medium">Payment Session Active</p>
                <p className="text-sm">
                  This request has an active payment session. Deleting it will automatically cancel 
                  the payment session so you won't be charged.
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
