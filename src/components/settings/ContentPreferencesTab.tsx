
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useNSFWPreference } from "@/hooks/useNSFWPreference";

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
  const [pendingNSFWEnable, setPendingNSFWEnable] = useState(false);

  // Age verification callback for the hook
  const handleAgeVerificationRequired = useCallback(async (): Promise<boolean> => {
    console.log('🎯 ContentPreferencesTab - Age verification callback triggered');
    return new Promise((resolve) => {
      setPendingNSFWEnable(true);
      setShowVerificationModal(true);
      
      // Set up a one-time listener for age verification completion
      const checkVerification = () => {
        if (isAgeVerified && !showVerificationModal) {
          console.log('✅ ContentPreferencesTab - Age verification completed');
          setPendingNSFWEnable(false);
          resolve(true);
          return true;
        }
        return false;
      };
      
      // Check immediately and then poll
      if (!checkVerification()) {
        const interval = setInterval(() => {
          if (checkVerification()) {
            clearInterval(interval);
          }
        }, 500);
        
        // Cleanup after 30 seconds
        setTimeout(() => {
          clearInterval(interval);
          if (pendingNSFWEnable) {
            console.log('❌ ContentPreferencesTab - Age verification timeout');
            setPendingNSFWEnable(false);
            resolve(false);
          }
        }, 30000);
      }
    });
  }, [isAgeVerified, showVerificationModal, setShowVerificationModal, pendingNSFWEnable]);

  const { showNSFW, updateNSFWPreference, isUpdating } = useNSFWPreference({
    onAgeVerificationRequired: handleAgeVerificationRequired
  });

  const handleNSFWToggle = async (enabled: boolean) => {
    console.log('🔥 ContentPreferencesTab - NSFW Toggle clicked:', { 
      enabled, 
      isAgeVerified, 
      showNSFW, 
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
            <div>Age Verified (Hook): {String(isAgeVerified)}</div>
            <div>NSFW Enabled: {showNSFW ? 'Yes' : 'No'}</div>
            <div>Modal Open: {showVerificationModal ? 'Yes' : 'No'}</div>
            <div>Loading: {isUpdating ? 'Yes' : 'No'}</div>
            <div>Pending NSFW: {pendingNSFWEnable ? 'Yes' : 'No'}</div>
            <div>User ID: {user?.id || 'None'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
