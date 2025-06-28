
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCreatorImageUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      console.error("No user ID available for upload");
      throw new Error("Please log in to upload images");
    }
    
    try {
      setIsUploading(true);
      
      // Check if the file is an actual image
      if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file");
      }
      
      // Generate unique filename with timestamp and original extension
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`Uploading to avatars/${filePath}`);
      
      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        
        // Provide helpful error messages
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error("Image storage is not properly configured. Please contact support.");
        } else if (uploadError.message?.includes('Insufficient privilege')) {
          throw new Error("You don't have permission to upload images. Please try logging out and back in.");
        }
        
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log("Upload successful, public URL:", publicUrl);
      
      // Update the creator profile with the new image URL
      const { error } = await supabase
        .from('creators')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Database update error:", error);
        // Don't throw here - the image was uploaded successfully
        toast({
          title: "Image uploaded",
          description: "Image uploaded but profile update failed. Please refresh the page.",
          variant: "destructive"
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['creator-settings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails', user?.id] });
      
      return publicUrl;
    } catch (error: any) {
      console.error("Image upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadBannerImage = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      console.error("No user ID available for upload");
      throw new Error("Please log in to upload images");
    }
    
    try {
      setIsUploading(true);
      
      // Check if the file is an actual image
      if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file");
      }
      
      // Generate unique filename with timestamp and original extension
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`Uploading to banners/${filePath}`);
      
      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        
        // Provide helpful error messages
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error("Image storage is not properly configured. Please contact support.");
        } else if (uploadError.message?.includes('Insufficient privilege')) {
          throw new Error("You don't have permission to upload images. Please try logging out and back in.");
        }
        
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);
      
      console.log("Banner upload successful, public URL:", publicUrl);
      
      // Update the creator profile with the new banner URL
      const { error } = await supabase
        .from('creators')
        .update({ banner_url: publicUrl })
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Database update error:", error);
        // Don't throw here - the image was uploaded successfully
        toast({
          title: "Banner uploaded",
          description: "Banner uploaded but profile update failed. Please refresh the page.",
          variant: "destructive"
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['creator-settings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails', user?.id] });
      
      return publicUrl;
    } catch (error: any) {
      console.error("Banner upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadProfileImage,
    uploadBannerImage
  };
};
