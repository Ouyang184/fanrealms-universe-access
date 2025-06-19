
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useNSFWPreference } from "@/hooks/useNSFWPreference";
import { useToast } from "@/hooks/use-toast";

interface ContentPreferencesTabProps {
  user: User | null;
  isAgeVerified: boolean;
  showVerificationModal: boolean;
  setShowVerificationModal: (show: boolean) => void;
  handleAgeVerified: (dateOfBirth: string) => void;
}

export function ContentPreferencesTab({ 
  user, 
  isAgeVerified, 
  showVerificationModal, 
  setShowVerificationModal, 
  handleAgeVerified 
}: ContentPreferencesTabProps) {
  const { toast } = useToast();

  const { showNSFW, updateNSFWPreference, isUpdating } = useNSFWPreference({
    onAgeVerificationRequired: async (): Promise<boolean> => {
      console.log('🎯 Age verification required - showing modal');
      setShowVerificationModal(true);
      
      // Wait for age verification to complete
      return new Promise((resolve) => {
        let checkCount = 0;
        const maxChecks = 60; // 30 seconds with 500ms intervals
        
        const checkVerification = () => {
          checkCount++;
          console.log(`🔍 Checking verification status (attempt ${checkCount}/${maxChecks}):`, {
            isAgeVerified,
            showVerificationModal,
            checkCount
          });
          
          if (isAgeVerified && !showVerificationModal) {
            console.log('✅ Age verification completed successfully');
            resolve(true);
            return;
          }
          
          if (checkCount >= maxChecks) {
            console.log('❌ Age verification timeout after 30 seconds');
            resolve(false);
            return;
          }
          
          // Check again in 500ms
          setTimeout(checkVerification, 500);
        };
        
        // Start checking after a brief delay
        setTimeout(checkVerification, 100);
      });
    }
  });

  const handleNSFWToggle = async (enabled: boolean) => {
    console.log('🔥 NSFW Toggle clicked:', { 
      enabled, 
      isAgeVerified, 
      currentNSFW: showNSFW,
      user: user?.id 
    });
    
    updateNSFWPreference(enabled);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Preferences</CardTitle>
        <CardDescription>
          Manage your content viewing preferences and restrictions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show NSFW Posts</Label>
            <p className="text-sm text-muted-foreground">
              Enable viewing of mature/adult content (requires age verification)
            </p>
          </div>
          <Switch 
            checked={showNSFW}
            onCheckedChange={handleNSFWToggle}
            disabled={isUpdating}
          />
        </div>
        
        {showNSFW && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">NSFW Content Enabled</p>
                <p className="text-xs">
                  You have verified your age and can now view mature content across the platform.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug information */}
        <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 font-mono mb-2">
            Debug Info:
          </p>
          <div className="text-xs text-gray-600 font-mono space-y-1">
            <div>Age Verified: {String(isAgeVerified)}</div>
            <div>NSFW Enabled: {showNSFW ? 'Yes' : 'No'}</div>
            <div>Modal Open: {showVerificationModal ? 'Yes' : 'No'}</div>
            <div>Loading: {isUpdating ? 'Yes' : 'No'}</div>
            <div>User ID: {user?.id || 'None'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
