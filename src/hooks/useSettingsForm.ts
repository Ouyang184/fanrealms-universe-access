
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorSettingsQuery } from "@/hooks/useCreatorSettingsQuery";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export const useSettingsForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    settings, 
    isLoading, 
    refetch
  } = useCreatorSettingsQuery();
  const { uploadProfileImage, isUploading } = useProfileImageUpload();
  
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Update formData when settings are loaded or changed, but only if no unsaved changes
  useEffect(() => {
    if (settings && !isLoading && !hasUnsavedChanges) {
      console.log('useSettingsForm: Settings loaded, updating form data:', settings);
      setFormData({ ...settings });
    }
  }, [settings, isLoading, hasUnsavedChanges]);

  const handleChange = (name: string, value: string | string[]) => {
    console.log('useSettingsForm: Form field changed:', { name, value });
    setHasUnsavedChanges(true);
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value
      };
      console.log('useSettingsForm: Updated form data:', updated);
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !user?.id || !settings?.id) {
      console.error('useSettingsForm: Missing data:', { 
        formData: !!formData, 
        userId: user?.id, 
        creatorId: settings?.id 
      });
      toast({
        title: "Error",
        description: "Unable to save settings. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('useSettingsForm: Starting save with form data:', formData);
      console.log('useSettingsForm: Current user ID:', user.id);
      console.log('useSettingsForm: Current creator ID:', settings.id);
      
      // Prepare the data for saving - ensure display_name is correctly mapped
      const dataToSave = {
        display_name: formData.display_name || '',
        bio: formData.bio || '',
        tags: formData.tags || [],
        profile_image_url: formData.profile_image_url || formData.avatar_url || '',
        banner_url: formData.banner_url || '',
      };

      console.log('useSettingsForm: Data to save:', dataToSave);

      // Update the database using the creator ID (more reliable than user_id)
      const { data: updatedData, error: updateError } = await supabase
        .from("creators")
        .update(dataToSave)
        .eq("id", settings.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('useSettingsForm: Supabase update error:', updateError);
        throw updateError;
      }

      if (!updatedData) {
        console.error('useSettingsForm: No creator record updated');
        throw new Error('Failed to update creator profile. Please try again.');
      }

      console.log('useSettingsForm: Save completed successfully, updated data:', updatedData);
      
      // IMPORTANT: Update form data with the exact values from the database
      // and mark as saved BEFORE invalidating queries to prevent race conditions
      const updatedFormData = {
        ...formData,
        display_name: updatedData.display_name,
        bio: updatedData.bio,
        tags: updatedData.tags,
        profile_image_url: updatedData.profile_image_url,
        banner_url: updatedData.banner_url,
      };
      
      console.log('useSettingsForm: Setting form data to saved values:', updatedFormData);
      setFormData(updatedFormData);
      
      // Mark as saved (no unsaved changes) BEFORE invalidating queries
      setHasUnsavedChanges(false);
      
      // Show success message
      toast({
        title: "Success",
        description: `Settings saved successfully! Display name is now: "${updatedData.display_name || 'Not set'}"`,
      });
      
      // Invalidate queries to ensure other components refresh - do this AFTER updating form state
      await queryClient.invalidateQueries({ queryKey: ['creator-settings'] });
      
    } catch (error: any) {
      console.error("useSettingsForm: Error in handleSave:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
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
          setHasUnsavedChanges(true);
          setFormData(prev => ({
            ...prev,
            avatar_url: imageUrl,
            profile_image_url: imageUrl
          }));
          
          // Invalidate queries after image upload
          await queryClient.invalidateQueries({ 
            queryKey: ['creator-settings'] 
          });
          
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
    
    setHasUnsavedChanges(true);
    setFormData(prev => ({
      ...prev,
      banner_url: bannerUrl
    }));
  };

  return {
    settings,
    formData,
    isLoading,
    isSaving,
    isUploading,
    hasUnsavedChanges,
    handleChange,
    handleSave,
    handleImageUpload,
    handleBannerUpdate,
    user
  };
};
