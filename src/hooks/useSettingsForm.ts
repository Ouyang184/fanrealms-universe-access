
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
  
  // Update formData when settings are loaded or changed
  useEffect(() => {
    if (settings && !isLoading) {
      console.log('useSettingsForm: Settings loaded, updating form data:', settings);
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

      // Update the database
      const { data: updatedData, error: updateError } = await supabase
        .from("creators")
        .update(dataToSave)
        .eq("user_id", user.id)
        .select();
        
      if (updateError) {
        console.error('useSettingsForm: Supabase update error:', updateError);
        throw updateError;
      }

      console.log('useSettingsForm: Save completed successfully, updated data:', updatedData);
      
      // Step 1: Invalidate ALL related queries to ensure fresh data
      console.log('useSettingsForm: Invalidating all creator-related queries...');
      await queryClient.invalidateQueries({ queryKey: ['creator-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      await queryClient.invalidateQueries({ queryKey: ['creators'] });
      
      // Step 2: Wait a moment for invalidation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 3: Force a refetch to get the absolute latest data
      console.log('useSettingsForm: Forcing refetch of creator settings...');
      const { data: freshData } = await refetch();
      
      if (freshData) {
        console.log('useSettingsForm: Fresh data received:', freshData);
        console.log('useSettingsForm: Fresh display_name:', freshData.display_name);
        
        // Step 4: COMPLETELY replace form data with fresh database data
        setFormData({ ...freshData });
        
        toast({
          title: "Success",
          description: `Settings updated successfully! Display name is now: "${freshData.display_name || 'Not set'}"`,
        });
      } else {
        console.warn('useSettingsForm: No fresh data returned from refetch');
        
        // Fallback: use the returned data from the update
        if (Array.isArray(updatedData) && updatedData.length > 0) {
          const firstUpdatedItem = updatedData[0];
          console.log('useSettingsForm: Using fallback data:', firstUpdatedItem);
          
          // Create new form data object with updated values
          const updatedFormData = {
            ...formData,
            display_name: firstUpdatedItem.display_name,
            bio: firstUpdatedItem.bio,
            tags: firstUpdatedItem.tags,
            profile_image_url: firstUpdatedItem.profile_image_url,
            banner_url: firstUpdatedItem.banner_url,
          };
          
          setFormData(updatedFormData);
          console.log('useSettingsForm: Form data updated with fallback:', updatedFormData);
          
          toast({
            title: "Success", 
            description: `Settings updated successfully! Display name is now: "${firstUpdatedItem.display_name || 'Not set'}"`,
          });
        } else {
          toast({
            title: "Warning",
            description: "Settings saved but couldn't refresh data. Please reload the page.",
            variant: "default",
          });
        }
      }
      
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
