
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { Spinner } from "@/components/ui/spinner";
import { useQueryClient } from '@tanstack/react-query';
import { CreatorSettingsData } from "@/types/creator-settings";

export default function CreatorStudioSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    settings, 
    isLoading, 
    isUploading,
    updateSettings, 
    uploadProfileImage 
  } = useCreatorSettings();
  
  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Update formData when settings are loaded or updated
  useEffect(() => {
    if (settings) {
      console.log('Settings updated, refreshing form data:', settings);
      setFormData({ ...settings });
      setHasUnsavedChanges(false);
    }
  }, [settings]);

  const handleChange = (name: string, value: string | string[]) => {
    console.log(`Updating form field ${name} to:`, value);
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save settings.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log('=== SAVE INITIATED ===');
      console.log('Current settings:', settings);
      console.log('Form data to save:', formData);
      
      // Create the payload with only the changed fields
      const changedFields: any = {};
      
      // Compare each field and only include if changed
      if (formData.display_name !== settings?.display_name) {
        changedFields.display_name = formData.display_name;
        console.log('Display name changed from', settings?.display_name, 'to', formData.display_name);
      }
      if (formData.bio !== settings?.bio) {
        changedFields.bio = formData.bio;
      }
      if (formData.username !== settings?.username) {
        changedFields.username = formData.username;
      }
      if (formData.banner_url !== settings?.banner_url) {
        changedFields.banner_url = formData.banner_url;
      }
      if (formData.profile_image_url !== settings?.profile_image_url) {
        changedFields.profile_image_url = formData.profile_image_url;
      }
      if (formData.avatar_url !== settings?.avatar_url) {
        changedFields.avatar_url = formData.avatar_url;
      }
      if (JSON.stringify(formData.tags) !== JSON.stringify(settings?.tags)) {
        changedFields.tags = formData.tags;
      }
      
      console.log('Payload (only changed fields):', changedFields);
      
      if (Object.keys(changedFields).length === 0) {
        console.log('No changes detected, skipping update');
        setHasUnsavedChanges(false);
        setIsSaving(false);
        return;
      }
      
      // Wait for the update to complete
      await new Promise<void>((resolve, reject) => {
        updateSettings(changedFields, {
          onSuccess: async (updatedData: any) => {
            console.log('Update completed successfully:', updatedData);
            
            // Immediately update formData with the new values to reflect changes in UI
            if (updatedData) {
              console.log('Immediately updating form with mutation result:', updatedData);
              setFormData({ ...updatedData });
            }
            
            // First invalidate to clear stale cache
            await queryClient.invalidateQueries({ 
              queryKey: ['creator-settings', user?.id] 
            });
            
            // Add longer delay to ensure Supabase has synced the data
            await new Promise((res) => setTimeout(res, 800));
            
            // Refetch the latest data from server
            await queryClient.refetchQueries({ 
              queryKey: ['creator-settings', user?.id] 
            });
            
            // Get the fresh data from the query cache and update form if needed
            const freshSettings = queryClient.getQueryData(['creator-settings', user?.id]) as CreatorSettingsData | undefined;
            
            if (freshSettings && freshSettings.id) {
              console.log('Syncing form with fresh server data:', freshSettings);
              setFormData({ ...freshSettings });
            }
            
            setHasUnsavedChanges(false);
            resolve();
          },
          onError: (error: any) => {
            console.error("Error saving settings:", error);
            reject(error);
          }
        });
      });
      
      console.log('=== SAVE COMPLETED ===');
    } catch (error) {
      console.error("Save failed:", error);
      // Keep form data as is so user doesn't lose changes
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
          setHasUnsavedChanges(true);
          
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
    setHasUnsavedChanges(true);
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
              disabled={isFormDisabled || !hasUnsavedChanges}
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
