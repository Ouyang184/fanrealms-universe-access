
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { Spinner } from "@/components/ui/spinner";

export default function CreatorStudioSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    settings, 
    isLoading, 
    isUploading,
    updateSettings,
    uploadProfileImage,
    refetch
  } = useCreatorSettings();
  
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Update formData when settings are loaded
  useEffect(() => {
    if (settings && !isLoading) {
      console.log('Settings loaded, updating form data:', settings);
      setFormData({ ...settings });
    }
  }, [settings, isLoading]);

  const handleChange = (name: string, value: string | string[]) => {
    console.log('CreatorStudioSettings: Form field changed:', { name, value });
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value
      };
      console.log('CreatorStudioSettings: Updated form data:', updated);
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !user?.id) {
      console.error('CreatorStudioSettings: Missing data:', { formData: !!formData, userId: user?.id });
      toast({
        title: "Error",
        description: "Unable to save settings. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('CreatorStudioSettings: Starting save with form data:', formData);
      console.log('CreatorStudioSettings: Current user ID:', user.id);
      
      // Prepare the data for saving - ensure display_name is properly mapped
      const dataToSave = {
        display_name: formData.display_name || '',
        bio: formData.bio || '',
        tags: formData.tags || [],
        profile_image_url: formData.profile_image_url || formData.avatar_url || '',
        banner_url: formData.banner_url || '',
      };

      console.log('CreatorStudioSettings: Data to save:', dataToSave);

      // Use the updateSettings function with proper callbacks
      updateSettings(dataToSave, {
        onSuccess: () => {
          console.log('CreatorStudioSettings: Save completed successfully');
          // Refetch the latest data to ensure UI is updated
          refetch().then(() => {
            console.log('CreatorStudioSettings: Refetched settings after save');
          });
          setIsSaving(false);
        },
        onError: (error: any) => {
          console.error("CreatorStudioSettings: Error saving settings:", error);
          toast({
            title: "Error",
            description: "Failed to save settings. Please try again.",
            variant: "destructive",
          });
          setIsSaving(false);
        }
      });
      
    } catch (error) {
      console.error("CreatorStudioSettings: Error in handleSave:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (type: 'avatar') => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload an image",
        variant: "destructive",
      });
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const imageUrl = await uploadProfileImage(file);
        if (imageUrl) {
          setFormData(prev => ({
            ...prev,
            avatar_url: imageUrl,
            profile_image_url: imageUrl
          }));
          
          toast({
            title: "Success",
            description: "Profile image updated successfully",
          });
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  };

  const handleBannerUpdate = async (bannerUrl: string) => {
    if (!user?.id) return;
    
    setFormData(prev => ({
      ...prev,
      banner_url: bannerUrl
    }));
  };

  const isFormDisabled = isLoading || isUploading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Creator Settings</h1>
        <div className="flex items-center justify-center py-8">
          <Spinner className="h-6 w-6 mr-2" />
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Creator Settings</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Unable to load creator settings. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Creator Settings</h1>
      
      <form onSubmit={handleSave}>
        <div className="space-y-6">
          <ProfileInfoForm 
            settings={formData} 
            onSettingsChange={handleChange} 
            onImageUpload={handleImageUpload}
            isUploading={isUploading}
          />
          
          <BannerSection 
            userId={user?.id || ''} 
            currentBannerUrl={formData?.banner_url} 
            onBannerUpdate={handleBannerUpdate}
          />
          
          {settings?.id && (
            <SocialLinksSection creatorId={settings.id} />
          )}
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isFormDisabled || isSaving}
              className="min-w-[140px]"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
