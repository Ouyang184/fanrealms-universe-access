
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
      
      console.log('Fetching creator settings for user:', user.id);
      
      // First check if creator exists
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('*, users:user_id(username, email)')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
        return null;
      }
      
      // If no creator exists, create one
      if (!creator) {
        console.log('No creator found, creating one for user:', user.id);
        const { data: newCreator, error: createError } = await supabase
          .from('creators')
          .insert({
            user_id: user.id,
            bio: '',
            display_name: '',
            profile_image_url: null,
            banner_url: null,
            tags: []
          })
          .select('*, users:user_id(username, email)')
          .single();
          
        if (createError) {
          console.error('Error creating creator:', createError);
          return null;
        }
        
        console.log('Created new creator:', newCreator);
        return formatCreatorData(newCreator);
      }
      
      console.log('Found existing creator:', creator);
      return formatCreatorData(creator);
    },
    enabled: !!user?.id,
  });

  const formatCreatorData = (data: any): CreatorSettings => {
    return {
      id: data.id,
      user_id: data.user_id,
      username: data.users?.username || '',
      fullName: data.users?.username || '',
      email: data.users?.email || '',
      bio: data.bio || '',
      display_name: data.display_name || '',
      displayName: data.display_name || '',
      avatar_url: data.profile_image_url,
      profile_image_url: data.profile_image_url,
      banner_url: data.banner_url,
      tags: data.tags || [],
      created_at: data.created_at
    };
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<CreatorSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!settings?.id) throw new Error('No creator ID found');
      
      console.log('Updating creator with ID:', settings.id);
      console.log('New display_name:', updatedSettings.display_name);
      
      // Prepare creator update data
      const creatorUpdateData = {
        bio: updatedSettings.bio,
        display_name: updatedSettings.display_name,
        banner_url: updatedSettings.banner_url,
        profile_image_url: updatedSettings.profile_image_url || updatedSettings.avatar_url,
        tags: updatedSettings.tags,
      };

      console.log('Creator update data:', creatorUpdateData);
      
      // Update the creator record using the creator ID directly
      const { data: updatedCreator, error: updateError } = await supabase
        .from('creators')
        .update(creatorUpdateData)
        .eq('id', settings.id)
        .select('*, users:user_id(username, email)')
        .single();
      
      if (updateError) {
        console.error('Error updating creator:', updateError);
        throw updateError;
      }
      
      console.log('Successfully updated creator in database:', updatedCreator);
      
      // Update user fields if needed
      if (updatedSettings.fullName || updatedSettings.username) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            username: updatedSettings.username
          })
          .eq('id', user.id);
        
        if (userError) {
          console.error('Error updating user:', userError);
          // Don't throw here, creator update was successful
        }
      }
      
      // Format and return the updated data
      const formattedData = formatCreatorData(updatedCreator);
      console.log('Formatted updated data to return:', formattedData);
      
      return formattedData;
    },
    onSuccess: (updatedData) => {
      console.log('Update successful! Setting cache with new data:', updatedData);
      
      // Immediately update the cache with the new data
      queryClient.setQueryData(['creator-settings', user?.id], updatedData);
      
      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creator-profile', user?.id] });
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
    if (!user?.id) {
      console.error("No user ID available for upload");
      return null;
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
        throw error;
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

  return {
    settings,
    isLoading,
    isUploading,
    updateSettings: updateSettingsMutation.mutate,
    uploadProfileImage
  };
};
