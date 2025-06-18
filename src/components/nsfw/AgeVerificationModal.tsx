
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgeVerificationModalProps {
  open: boolean;
  onVerified: (dateOfBirth: string) => void;
  onCancel: () => void;
}

export function AgeVerificationModal({ open, onVerified, onCancel }: AgeVerificationModalProps) {
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleVerification = async () => {
    if (!dateOfBirth) {
      toast({
        title: "Date of birth required",
        description: "Please enter your date of birth to continue.",
        variant: "destructive",
      });
      return;
    }

    const age = calculateAge(dateOfBirth);
    
    if (age < 18) {
      toast({
        title: "Access restricted",
        description: "You must be 18 or older to view this content.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Pass the dateOfBirth to the parent component
      onVerified(dateOfBirth);
    } catch (error) {
      console.error('Age verification error:', error);
      toast({
        title: "Verification failed",
        description: "Unable to verify age. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !isVerifying && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription>
            This content is marked as 18+. Please verify your age to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              disabled={isVerifying}
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Your date of birth will be stored securely and used only for age verification purposes.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerification}
              disabled={isVerifying || !dateOfBirth}
            >
              {isVerifying ? "Verifying..." : "Verify Age"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
