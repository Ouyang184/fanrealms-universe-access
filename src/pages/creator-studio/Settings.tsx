
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your creator profile and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your creator profile details and bio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileInfoForm 
              settings={settings}
              onUpdate={updateSettings}
              onUploadImage={uploadProfileImage}
              isUploading={isUploading}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Banner Image */}
        <BannerSection 
          settings={settings}
          onUpdate={updateSettings}
        />

        <Separator />

        {/* Social Links */}
        <SocialLinksSection 
          settings={settings}
          onUpdate={updateSettings}
        />

        <Separator />

        {/* NSFW Content Toggle */}
        <NSFWToggleSection 
          settings={settings}
          onUpdate={updateSettings}
        />

        <Separator />

        {/* Stripe Connect */}
        <StripeConnectSection />
      </div>
    </div>
  );
}
