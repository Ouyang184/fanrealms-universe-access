
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SaveButton } from "@/components/creator-studio/settings/SaveButton";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { CreatorSettingsData } from "@/types/creator-settings";

export default function CreatorSettings() {
  const { settings, isLoading, updateSettings, isUploading, uploadProfileImage } = useCreatorSettings();
  const [isSaving, setIsSaving] = useState(false);
  
  // Track unsaved changes
  const { currentData, hasChanges, updateData, resetChanges } = useUnsavedChanges(settings || {} as CreatorSettingsData);

  // Update current data when settings load
  useEffect(() => {
    if (settings) {
      resetChanges();
    }
  }, [settings, resetChanges]);

  const handleSettingsChange = (name: string, value: string | string[] | boolean) => {
    updateData({ [name]: value });
  };

  const handleSave = async () => {
    if (!hasChanges || !settings) return;

    setIsSaving(true);
    try {
      await updateSettings(currentData as Partial<CreatorSettingsData>);
      resetChanges();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (type: 'avatar' | 'banner') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && settings?.id) {
        const imageUrl = await uploadProfileImage(file);
        if (imageUrl) {
          const fieldName = type === 'avatar' ? 'avatar_url' : 'banner_url';
          handleSettingsChange(fieldName, imageUrl);
        }
      }
    };
    
    input.click();
  };

  const handleBannerUpdate = (bannerUrl: string) => {
    handleSettingsChange('banner_url', bannerUrl);
  };

  if (isLoading || !settings) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-semibold">Creator Settings</h1>
        <p className="text-muted-foreground">Manage your creator profile and preferences</p>
      </div>

      <ProfileInfoForm
        settings={currentData as CreatorSettingsData}
        onSettingsChange={handleSettingsChange}
        onImageUpload={handleImageUpload}
        isUploading={isUploading}
      />

      <BannerSection
        userId={settings.id}
        currentBannerUrl={(currentData as CreatorSettingsData).banner_url || null}
        onBannerUpdate={handleBannerUpdate}
      />

      <Card>
        <CardHeader>
          <CardTitle>Content Settings</CardTitle>
          <CardDescription>Configure your content preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="nsfw-toggle">NSFW Content</Label>
              <p className="text-sm text-muted-foreground">
                Mark your profile as containing mature content
              </p>
            </div>
            <Switch
              id="nsfw-toggle"
              checked={(currentData as CreatorSettingsData).is_nsfw || false}
              onCheckedChange={(checked) => handleSettingsChange('is_nsfw', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <SaveButton
        onSave={handleSave}
        isLoading={isSaving}
        hasChanges={hasChanges}
      />
    </div>
  );
}
