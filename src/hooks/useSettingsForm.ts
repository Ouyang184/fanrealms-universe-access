
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
  
  // Update formData when settings are loaded
  useEffect(() => {
    if (settings && !isLoading) {
      console.log('Settings loaded, updating form data:', settings);
      setFormData({ ...settings });
    }
  }, [settings, isLoading]);

  const handleChange = (name: string, value: string | string[]) => {
    console.log('useSettingsForm: Form field changed:', { name, value });
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
    
    if (!formData || !user?.id) {
      console.error('useSettingsForm: Missing data:', { formData: !!formData, userId: user?.id });
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
      
      // Prepare the data for saving - ensure display_name is correctly mapped
      const dataToSave = {
        display_name: formData.display_name || '',
        bio: formData.bio || '',
        tags: formData.tags || [],
        profile_image_url: formData.profile_image_url || formData.avatar_url || '',
        banner_url: formData.banner_url || '',
      };

      console.log('useSettingsForm: Data to save:', dataToSave);

      // Direct Supabase update with .select().single() to get the updated data
      const { data: updatedData, error: updateError } = await supabase
        .from("creators")
        .update(dataToSave)
        .eq("user_id", user.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('useSettingsForm: Supabase update error:', updateError);
        throw updateError;
      }

      console.log('useSettingsForm: Save completed successfully, updated data:', updatedData);
      
      // Update formData immediately with the saved data to prevent reversion
      const updatedFormData = {
        ...formData,
        display_name: updatedData.display_name,
        displayName: updatedData.display_name, // Keep both in sync
        bio: updatedData.bio,
        tags: updatedData.tags,
        profile_image_url: updatedData.profile_image_url,
        banner_url: updatedData.banner_url,
      };
      
      setFormData(updatedFormData);
      console.log('useSettingsForm: Form data updated after save:', updatedFormData);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Your settings have been updated successfully",
      });

      // Clear ALL query cache to ensure fresh data everywhere
      console.log('useSettingsForm: Clearing entire query cache...');
      await queryClient.clear();
      
      // Force refetch to get fresh data
      console.log('useSettingsForm: Forcing refetch...');
      await refetch();
      
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

  return {
    settings,
    formData,
    isLoading,
    isSaving,
    isUploading,
    handleChange,
    handleSave,
    handleImageUpload,
    handleBannerUpdate,
    user
  };
};
