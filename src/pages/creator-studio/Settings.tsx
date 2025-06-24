
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { NSFWToggleSection } from "@/components/creator-studio/settings/NSFWToggleSection";
import { StripeConnectSection } from "@/components/creator-studio/StripeConnectSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function CreatorStudioSettings() {
  const { user } = useAuth();
  const { settings, isLoading, updateSettings, uploadProfileImage, isUploading } = useCreatorSettings();

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
    updateSettings({ [name]: value });
  };

  const handleImageUpload = async (type: 'avatar') => {
    // Create file input and trigger upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadProfileImage(file);
      }
    };
    input.click();
  };

  const handleBannerUpdate = (bannerUrl: string) => {
    updateSettings({ banner_url: bannerUrl });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your creator profile and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <ProfileInfoForm 
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
        />

        <Separator />

        {/* Banner Image */}
        <BannerSection 
          userId={user?.id || ''}
          currentBannerUrl={settings.banner_url}
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
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />

        <Separator />

        {/* Stripe Connect */}
        <StripeConnectSection />
      </div>
    </div>
  );
}
