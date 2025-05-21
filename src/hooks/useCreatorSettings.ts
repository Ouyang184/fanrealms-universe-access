
import { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CreatorSettings } from '@/types/creator-studio';

export const useCreatorSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['creator-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('*, users:user_id(username, email)')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching creator settings:', error);
        return null;
      }
      
      // Format the data to match CreatorSettings interface
      return {
        id: data.id,
        user_id: data.user_id,
        username: data.users?.username || '',
        fullName: data.users?.username || '',
        email: data.users?.email || '',
        bio: data.bio || '',
        website: data.website || '',
        avatar_url: data.profile_image_url,
        profile_image_url: data.profile_image_url,
        banner_url: data.banner_url,
        created_at: data.created_at
      } as CreatorSettings;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updatedSettings: Partial<CreatorSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Update creator-specific fields
      const creatorFields = {
        bio: updatedSettings.bio,
        website: updatedSettings.website,
      };
      
      const { error } = await supabase
        .from('creators')
        .update(creatorFields)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update user fields if needed
      if (updatedSettings.fullName || updatedSettings.username) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            username: updatedSettings.username
          })
          .eq('id', user.id);
        
        if (userError) throw userError;
      }
      
      return { ...settings, ...updatedSettings };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['creator-settings', user?.id], data);
      toast({
        title: "Settings updated",
        description: "Your creator profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating creator settings:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;
    
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl }} = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update the profile with the new image URL
      const { error } = await supabase
        .from('creators')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['creator-settings'] });
      
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully."
      });
      
      return publicUrl;
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    settings,
    isLoading,
    isUploading,
    updateSettings: updateSettings.mutate,
    uploadProfileImage
  };
};
