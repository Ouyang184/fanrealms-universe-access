
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { StripeConnectSection } from "@/components/creator-studio/StripeConnectSection";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useState } from "react";
import { Save } from "lucide-react";

export default function CreatorStudioSettings() {
  const { settings, isLoading, updateSettings, uploadProfileImage, isUploading } = useCreatorSettings();
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load creator settings</p>
      </div>
    );
  }

  const handleSettingsChange = (name: string, value: string | string[]) => {
    setPendingChanges(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (type: 'avatar') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await uploadProfileImage(file);
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
    };
    input.click();
  };

  const handleBannerUpdate = (bannerUrl: string) => {
    setPendingChanges(prev => ({
      ...prev,
      banner_url: bannerUrl
    }));
  };

  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings(pendingChanges);
      setPendingChanges({});
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Merge current settings with pending changes for display
  const displaySettings = { ...settings, ...pendingChanges };
  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Creator Settings</h1>
        <p className="text-muted-foreground">Manage your creator profile and account settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileInfoForm 
            settings={displaySettings}
            onSettingsChange={handleSettingsChange}
            onImageUpload={handleImageUpload}
            isUploading={isUploading}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <StripeConnectSection />
        </TabsContent>

        <TabsContent value="website" className="space-y-6">
          <SocialLinksSection creatorId={settings.id} />
        </TabsContent>

        <TabsContent value="banner" className="space-y-6">
          <BannerSection 
            userId={settings.user_id}
            currentBannerUrl={displaySettings.banner_url}
            onBannerUpdate={handleBannerUpdate}
          />
        </TabsContent>
      </Tabs>

      {/* Save Changes Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={handleSaveChanges}
          disabled={!hasChanges || isSaving}
          className="min-w-[120px]"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
