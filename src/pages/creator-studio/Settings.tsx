
import { useState, useEffect } from "react";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { NSFWToggleSection } from "@/components/creator-studio/settings/NSFWToggleSection";
import { StripeConnectSection } from "@/components/creator-studio/StripeConnectSection";
import { SaveButton } from "@/components/creator-studio/settings/SaveButton";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreatorSettingsData } from "@/types/creator-settings";
import { useToast } from "@/hooks/use-toast";

export default function CreatorStudioSettings() {
  const { user } = useAuth();
  const { settings, isLoading, updateSettings, uploadProfileImage, isUploading } = useCreatorSettings();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Track unsaved changes
  const { currentData, hasChanges, updateData, resetChanges } = useUnsavedChanges(settings || {} as CreatorSettingsData);

  // Update current data when settings load
  useEffect(() => {
    if (settings) {
      resetChanges();
    }
  }, [settings, resetChanges]);

  // Debug log to see if changes are being tracked
  useEffect(() => {
    console.log('Has changes:', hasChanges);
    console.log('Current data:', currentData);
  }, [hasChanges, currentData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Creator Settings Not Found</h1>
          <p className="text-muted-foreground">Unable to load your creator settings. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const handleSettingsChange = (name: string, value: string | string[] | boolean) => {
    console.log('Settings change:', name, value);
    updateData({ [name]: value });
  };

  const handleImageUpload = async (type: 'avatar') => {
    // Create file input and trigger upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && settings?.id) {
        const imageUrl = await uploadProfileImage(file);
        if (imageUrl) {
          handleSettingsChange('avatar_url', imageUrl);
        }
      }
    };
    input.click();
  };

  const handleBannerUpdate = (bannerUrl: string) => {
    handleSettingsChange('banner_url', bannerUrl);
  };

  const handleSave = async () => {
    if (!hasChanges || !settings) return;

    setIsSaving(true);
    try {
      await updateSettings(currentData as Partial<CreatorSettingsData>);
      resetChanges();
      toast({
        title: "Settings saved",
        description: "Your creator settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your creator profile and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <ProfileInfoForm 
          settings={currentData as CreatorSettingsData}
          onSettingsChange={handleSettingsChange}
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
        />

        <Separator />

        {/* Banner Image */}
        <BannerSection 
          userId={user?.id || ''}
          currentBannerUrl={(currentData as CreatorSettingsData).banner_url || null}
          onBannerUpdate={handleBannerUpdate}
        />

        <Separator />

        {/* Social Links */}
        <SocialLinksSection 
          creatorId={settings.id}
        />

        <Separator />

        {/* NSFW Content Toggle */}
        <NSFWToggleSection 
          settings={currentData as CreatorSettingsData}
          onSettingsChange={handleSettingsChange}
        />

        <Separator />

        {/* Stripe Connect */}
        <StripeConnectSection />
      </div>

      <SaveButton
        onSave={handleSave}
        isLoading={isSaving}
        hasChanges={hasChanges}
      />
    </div>
  );
}
