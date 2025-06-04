import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CreatorTermsModal } from "./CreatorTermsModal";
import { CreatorNameModal } from "./CreatorNameModal";

interface CreatorSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatorSignupModal({ open, onOpenChange }: CreatorSignupModalProps) {
  const { createProfile, isCreating } = useCreatorProfile();
  const [showTerms, setShowTerms] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  const handleSignUpClick = () => {
    console.log("Sign up button clicked, showing terms modal");
    setShowTerms(true);
  };

  const handleTermsAccept = () => {
    console.log("Terms accepted, showing name modal");
    setShowTerms(false);
    setShowNameModal(true);
  };

  const handleTermsDecline = () => {
    console.log("Terms declined, closing modals");
    setShowTerms(false);
    // Keep the signup modal open so user can try again
  };

  const handleNameComplete = (displayName: string) => {
    console.log("Creator name set:", displayName);
    setShowNameModal(false);
    onOpenChange(false); // Close all modals
    createProfile(displayName);
  };

  const handleClose = () => {
    console.log("Signup modal closed");
    setShowTerms(false);
    setShowNameModal(false);
    onOpenChange(false);
  };

  const shouldShowSignupModal = open && !showTerms && !showNameModal;

  return (
    <>
      <Dialog open={shouldShowSignupModal} onOpenChange={onOpenChange}>
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
        onDecline={handleTermsDecline}
      />

      <CreatorNameModal
        open={showNameModal}
        onOpenChange={setShowNameModal}
        onComplete={handleNameComplete}
        isCreating={isCreating}
      />
    </>
  );
}
