
import { useState, useEffect } from "react";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { NSFWToggleSection } from "@/components/creator-studio/settings/NSFWToggleSection";
import { StripeConnectSection } from "@/components/creator-studio/StripeConnectSection";
import { Separator } from "@/components/ui/separator";
import { CreatorSettingsData } from "@/types/creator-settings";
import { useToast } from "@/hooks/use-toast";

export default function CreatorStudioSettings() {
  const { user } = useAuth();
  const { settings, isLoading, updateSettings, uploadProfileImage, isUploading } = useCreatorSettings();
  const [profileData, setProfileData] = useState<CreatorSettingsData | null>(null);
  const [bannerData, setBannerData] = useState<CreatorSettingsData | null>(null);
  const [profileHasChanges, setProfileHasChanges] = useState(false);
  const [bannerHasChanges, setBannerHasChanges] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isBannerSaving, setIsBannerSaving] = useState(false);
  const { toast } = useToast();

  // Initialize data when settings load
  useEffect(() => {
    if (settings) {
      setProfileData({ ...settings });
      setBannerData({ ...settings });
      setProfileHasChanges(false);
      setBannerHasChanges(false);
    }
  }, [settings]);

  // Track profile changes
  useEffect(() => {
    if (profileData && settings) {
      const hasProfileChanges = 
        profileData.display_name !== settings.display_name ||
        profileData.bio !== settings.bio ||
        JSON.stringify(profileData.tags) !== JSON.stringify(settings.tags) ||
        profileData.avatar_url !== settings.avatar_url;
      setProfileHasChanges(hasProfileChanges);
    }
  }, [profileData, settings]);

  // Track banner changes
  useEffect(() => {
    if (bannerData && settings) {
      const hasBannerChanges = bannerData.banner_url !== settings.banner_url;
      setBannerHasChanges(hasBannerChanges);
    }
  }, [bannerData, settings]);

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

  const handleProfileSettingsChange = (name: string, value: string | string[] | boolean) => {
    if (profileData) {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const handleBannerUpdate = (bannerUrl: string) => {
    if (bannerData) {
      setBannerData({ ...bannerData, banner_url: bannerUrl });
    }
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
          handleProfileSettingsChange('avatar_url', imageUrl);
        }
      }
    };
    input.click();
  };

  const handleProfileSave = async () => {
    if (!profileHasChanges || !profileData) return;

    setIsProfileSaving(true);
    try {
      await updateSettings({
        display_name: profileData.display_name,
        bio: profileData.bio,
        tags: profileData.tags,
        avatar_url: profileData.avatar_url,
      } as Partial<CreatorSettingsData>);
      
      setProfileHasChanges(false);
      toast({
        title: "Profile saved",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Error saving profile",
        description: "Failed to save your profile information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleBannerSave = async () => {
    if (!bannerHasChanges || !bannerData) return;

    setIsBannerSaving(true);
    try {
      await updateSettings({
        banner_url: bannerData.banner_url,
      } as Partial<CreatorSettingsData>);
      
      setBannerHasChanges(false);
      toast({
        title: "Banner saved",
        description: "Your banner image has been updated successfully.",
      });
    } catch (error) {
      console.error('Failed to save banner:', error);
      toast({
        title: "Error saving banner",
        description: "Failed to save your banner image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBannerSaving(false);
    }
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
          settings={profileData as CreatorSettingsData}
          onSettingsChange={handleProfileSettingsChange}
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
          onSave={handleProfileSave}
          isSaving={isProfileSaving}
          hasChanges={profileHasChanges}
        />

        <Separator />

        {/* Banner Image */}
        <BannerSection 
          userId={user?.id || ''}
          currentBannerUrl={bannerData?.banner_url || null}
          onBannerUpdate={handleBannerUpdate}
          onSave={handleBannerSave}
          isSaving={isBannerSaving}
          hasChanges={bannerHasChanges}
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
          onSettingsChange={(name, value) => {
            // Handle NSFW toggle separately since it's independent
          }}
        />

        <Separator />

        {/* Stripe Connect */}
        <StripeConnectSection />
      </div>
    </div>
  );
}
