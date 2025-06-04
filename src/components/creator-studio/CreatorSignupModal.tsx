
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CreatorTermsModal } from "./CreatorTermsModal";

interface CreatorSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatorSignupModal({ open, onOpenChange }: CreatorSignupModalProps) {
  const { createProfile, isCreating } = useCreatorProfile();
  const [showTerms, setShowTerms] = useState(false);

  const handleSignUpClick = () => {
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
    createProfile();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Become a Creator</DialogTitle>
            <DialogDescription>
              Join our creator community and start sharing your content with your audience.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              As a creator, you'll be able to post content, create membership tiers, 
              and engage with your subscribers through our creator studio.
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button variant="outline" onClick={handleClose}>
              No, maybe later
            </Button>
            <Button 
              onClick={handleSignUpClick} 
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating && <LoadingSpinner className="h-4 w-4" />}
              Yes, sign me up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreatorTermsModal
        open={showTerms}
        onOpenChange={setShowTerms}
        onAccept={handleTermsAccept}
      />
    </>
  );
}
