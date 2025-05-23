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

      // First, let's verify the creator record exists
      const { data: existingCreator, error: fetchError } = await supabase
        .from("creators")
        .select("id, display_name")
        .eq("id", settings.id)
        .maybeSingle();
        
      if (fetchError) {
        console.error('useSettingsForm: Error fetching creator:', fetchError);
        throw new Error('Failed to verify creator record');
      }
      
      if (!existingCreator) {
        console.error('useSettingsForm: Creator record not found with ID:', settings.id);
        throw new Error('Creator record not found');
      }
      
      console.log('useSettingsForm: Found existing creator:', existingCreator);

      // Now update the record
      const { data: updatedData, error: updateError } = await supabase
        .from("creators")
        .update(dataToSave)
        .eq("id", settings.id)
        .select("id, display_name, bio, tags, profile_image_url, banner_url")
        .single();
        
      if (updateError) {
        console.error('useSettingsForm: Supabase update error:', updateError);
        throw updateError;
      }

      if (!updatedData) {
        console.error('useSettingsForm: No data returned from update');
        throw new Error('Failed to update creator profile. No data returned.');
      }

      console.log('useSettingsForm: Save completed successfully, updated data:', updatedData);
      
      // Update form data with the exact values from the database
      setFormData(prev => ({
        ...prev,
        ...updatedData,
        displayName: updatedData.display_name // Keep backward compatibility
      }));
      
      console.log('useSettingsForm: Updated form data after save:', {
        newDisplayName: updatedData.display_name,
        formDisplayName: formData.display_name
      });
      
      // Mark as saved (no unsaved changes)
      setHasUnsavedChanges(false);
      
      // Show success message
      toast({
        title: "Success",
        description: `Settings saved successfully! Display name updated to: "${updatedData.display_name}"`,
      });
      
      // Force update the cached query data to reflect the changes immediately
      queryClient.setQueryData(['creator-settings', user.id], (oldData: any) => {
        if (!oldData) return oldData;
        console.log('useSettingsForm: Updating cache with:', updatedData);
        return {
          ...oldData,
          ...updatedData,
          displayName: updatedData.display_name
        };
      });
      
      // Invalidate and refetch to ensure consistency
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
