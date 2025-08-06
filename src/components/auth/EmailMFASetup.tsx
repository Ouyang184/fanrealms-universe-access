import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Shield, X } from "lucide-react";
import { useEmailMFA } from "@/hooks/useEmailMFA";
import { useAuth } from "@/contexts/AuthContext";

export function EmailMFASetup() {
  const { user } = useAuth();
  const { isEnabled, isLoading, enableEmailMFA, disableEmailMFA } = useEmailMFA();
  // Automatically show management view if 2FA is already enabled
  const [isManaging, setIsManaging] = useState(false);

  // Show management view by default if 2FA is enabled
  const shouldShowManagement = isEnabled || isManaging;

  const handleToggleMFA = async () => {
    if (isEnabled) {
      setIsManaging(true);
    } else {
      await enableEmailMFA();
    }
  };

  const handleDisableMFA = async () => {
    await disableEmailMFA();
    setIsManaging(false);
  };

  if (shouldShowManagement) {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Email Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            You can disable email-based two-factor authentication below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <Mail className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">Email 2FA</p>
              <p className="text-sm text-muted-foreground">
                Currently protecting your account
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Disabling email 2FA will make your account less secure. Make sure you have other security measures in place.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsManaging(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDisableMFA}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            {isLoading ? "Disabling..." : "Disable Email 2FA"}
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <DialogTitle>Set up Email Two-Factor Authentication</DialogTitle>
        <DialogDescription>
          Add an extra layer of security to your account by enabling email-based two-factor authentication.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium">Enable email 2FA</p>
              <p className="text-sm text-muted-foreground">
                We'll send verification codes to {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium">Sign in with codes</p>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your email when signing in
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> Make sure you have access to your email account before enabling this feature.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button 
          onClick={handleToggleMFA}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Setting up..." : "Enable Email 2FA"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}