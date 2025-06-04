
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";

interface CreatorNameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (displayName: string) => void;
  isCreating: boolean;
}

export function CreatorNameModal({ open, onOpenChange, onComplete, isCreating }: CreatorNameModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    console.log("Creator name submit clicked, displayName:", displayName);
    
    if (!displayName.trim()) {
      setError("Please enter a creator name");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("Creator name must be at least 2 characters long");
      return;
    }

    onComplete(displayName.trim());
  };

  const handleClose = () => {
    console.log("Creator name modal closed");
    setDisplayName("");
    setError("");
    onOpenChange(false);
  };

  const handleInputChange = (value: string) => {
    setDisplayName(value);
    if (error) {
      setError("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose Your Creator Name</DialogTitle>
          <DialogDescription>
            This is the name that will be displayed to your audience and subscribers.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creator-name">Creator Display Name</Label>
            <Input
              id="creator-name"
              value={displayName}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter your creator name..."
              disabled={isCreating}
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Tips for choosing a good creator name:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Make it memorable and easy to spell</li>
              <li>Keep it professional and brand-friendly</li>
              <li>You can change it later in your settings</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isCreating || !displayName.trim()}
            className="gap-2"
          >
            {isCreating && <LoadingSpinner className="h-4 w-4" />}
            {isCreating ? "Creating Profile..." : "Create Creator Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
