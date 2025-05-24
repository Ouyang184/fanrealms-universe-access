
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { StripeConnectSection } from "@/components/creator-studio/StripeConnectSection";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CreatorStudioSettings() {
  const { settings, isLoading, updateSettings, uploadProfileImage, isUploading } = useCreatorSettings();

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
    updateSettings({ [name]: value });
  };

  const handleImageUpload = (type: 'avatar') => {
    uploadProfileImage(type);
  };

  const handleBannerUpdate = (bannerUrl: string) => {
    updateSettings({ banner_url: bannerUrl });
  };

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
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileInfoForm 
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onImageUpload={handleImageUpload}
            isUploading={isUploading}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <StripeConnectSection />
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <SocialLinksSection creatorId={settings.id} />
        </TabsContent>

        <TabsContent value="banner" className="space-y-6">
          <BannerSection 
            userId={settings.user_id}
            currentBannerUrl={settings.banner_url}
            onBannerUpdate={handleBannerUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
