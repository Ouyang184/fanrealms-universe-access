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
    uploadProfileImage 
  } = useCreatorSettings();
  
  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  
  // Update formData when settings are loaded, but preserve any unsaved changes
  useEffect(() => {
    if (settings && !isLoading && !isSaving) {
      console.log('Settings loaded, updating formData:', settings);
      setFormData({ ...settings });
    }
  }, [settings, isLoading, isSaving]);

  const handleChange = (name: string, value: string | string[]) => {
    console.log(`Updating form field ${name} to:`, value);
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      console.log('Saving settings with formData:', formData);
      
      await updateSettings(formData);
      
      // Keep the formData as is (don't reset to settings) so the UI shows the saved values
      console.log('Save successful, keeping formData as:', formData);
      
      toast({
        title: "Success",
        description: "Your settings have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
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
    
    // Trigger file dialog
    input.click();
  };

  const handleBannerUpdate = async (bannerUrl: string) => {
    if (!user?.id) return;
    
    setFormData(prev => ({
      ...prev,
      banner_url: bannerUrl
    }));
  };

  const isFormDisabled = isLoading || isUploading || isSaving;

  // Show loading if we don't have settings yet
  if (isLoading && !settings) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading settings...</span>
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
          
          {formData?.id && (
            <SocialLinksSection creatorId={formData.id} />
          )}
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isFormDisabled}
              className={`${isSaving ? "opacity-70 pointer-events-none bg-primary/90" : ""}`}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Saving...
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
