import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatorSettings } from "@/hooks/useCreatorSettings";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function CreatorStudioSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    settings, 
    isLoading, 
    isUploading,
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
      console.log('=== DIRECT SAVE INITIATED ===');
      console.log('Form data to save:', formData);
      
      // First check if creator exists
      const { data: creator, error: fetchError } = await supabase
        .from("creators")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Current creator:', creator);

      if (!creator) {
        console.log('No creator found, creating new one');
        const { error: insertError } = await supabase
          .from("creators")
          .insert({ 
            user_id: user.id, 
            display_name: formData.display_name || '',
            bio: formData.bio || '',
            profile_image_url: formData.profile_image_url || null,
            banner_url: formData.banner_url || null,
            tags: formData.tags || []
          });
        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      } else {
        console.log('Updating existing creator');
        const { error: updateError } = await supabase
          .from("creators")
          .update({ 
            display_name: formData.display_name || '',
            bio: formData.bio || '',
            profile_image_url: formData.profile_image_url || null,
            banner_url: formData.banner_url || null,
            tags: formData.tags || []
          })
          .eq("user_id", user.id);
        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      }

      // Clear all related caches and refetch
      console.log('Invalidating queries and refetching...');
      await queryClient.invalidateQueries({ queryKey: ['creator-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['creatorProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['creator-profile'] });
      
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 250));
      
      // Fetch fresh data to confirm the update
      const { data: updatedCreator, error: refetchError } = await supabase
        .from("creators")
        .select("*, users:user_id(username, email)")
        .eq("user_id", user.id)
        .single();
        
      if (refetchError) {
        console.error('Refetch error:', refetchError);
      } else {
        console.log('Fresh data from database:', updatedCreator);
      }

      setHasUnsavedChanges(false);

      toast({
        title: "Success",
        description: `Settings saved successfully. Display name: "${formData.display_name}"`,
      });
      
      console.log('=== SAVE COMPLETED ===');
    } catch (error) {
      console.error("Save failed:", error);
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
