
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
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
  const { toast } = useToast();
  const { showNSFW, updateNSFWPreference, isUpdating } = useNSFWPreference();
  const [pendingNSFWEnable, setPendingNSFWEnable] = useState(false);

  // Handle age verification completion
  useEffect(() => {
    console.log('🔍 ContentPreferencesTab - Age verification effect:', { 
      isAgeVerified, 
      showVerificationModal, 
      pendingNSFWEnable 
    });
    
    // If age was just verified and we have a pending NSFW enable request
    if (isAgeVerified && !showVerificationModal && pendingNSFWEnable) {
      console.log('🎉 ContentPreferencesTab - Age verification completed, enabling NSFW');
      updateNSFWPreference(true);
      setPendingNSFWEnable(false);
    }
  }, [isAgeVerified, showVerificationModal, pendingNSFWEnable, updateNSFWPreference]);

  const handleNSFWToggle = async (enabled: boolean) => {
    console.log('🔥 ContentPreferencesTab - NSFW Toggle clicked:', { 
      enabled, 
      isAgeVerified, 
      showNSFW, 
      user: user?.id 
    });
    
    // If trying to enable NSFW, always check age verification
    if (enabled) {
      console.log('🚨 ContentPreferencesTab - Checking age verification for NSFW enable');
      
      // Always force a fresh database check for age verification
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('age_verified')
          .eq('id', user?.id)
          .single();

        console.log('🔍 ContentPreferencesTab - Fresh age verification check:', { 
          userData, 
          error,
          age_verified: userData?.age_verified 
        });

        if (error || !userData?.age_verified) {
          console.log('🚨 ContentPreferencesTab - Age verification required, showing modal');
          setPendingNSFWEnable(true);
          setShowVerificationModal(true);
          return; // Don't update the switch state yet
        }

        // If age is verified, proceed with enabling NSFW
        console.log('✅ ContentPreferencesTab - Age already verified, enabling NSFW');
      } catch (error) {
        console.error('ContentPreferencesTab - Error checking age:', error);
        toast({
          title: "Error",
          description: "Failed to verify age status.",
          variant: "destructive",
        });
        return;
      }
    }

    // Update NSFW setting using the hook
    console.log('🟢 ContentPreferencesTab - Processing NSFW toggle:', enabled);
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
