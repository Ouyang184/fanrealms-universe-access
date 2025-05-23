
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CreatorSettings } from '@/types/creator-studio';

export const useCreatorSettingsMutation = (settings: CreatorSettings | null, refetch: () => void) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<CreatorSettings>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('updateSettingsMutation: Starting update with data:', updatedSettings);
      console.log('updateSettingsMutation: User ID:', user.id);
      
      // Update creator-specific fields
      const creatorFields = {
        bio: updatedSettings.bio,
        display_name: updatedSettings.display_name,
        banner_url: updatedSettings.banner_url,
        profile_image_url: updatedSettings.profile_image_url,
        tags: updatedSettings.tags,
      };
      
      // Filter out undefined values
      Object.keys(creatorFields).forEach(key => {
        if (creatorFields[key] === undefined) {
          delete creatorFields[key];
        }
      });
      
      console.log('updateSettingsMutation: Creator fields to update:', creatorFields);
      console.log('updateSettingsMutation: Updating creators table where user_id =', user.id);
      
      const { data, error } = await supabase
        .from('creators')
        .update(creatorFields)
        .eq('user_id', user.id)
        .select();
      
      if (error) {
        console.error('updateSettingsMutation: Supabase error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('updateSettingsMutation: No data returned after update');
        throw new Error('Failed to update creator settings: No data returned');
      }
      
      const updatedData = data[0];
      console.log('updateSettingsMutation: Update successful:', updatedData);
      
      // Update user fields if needed (username)
      if (updatedSettings.fullName || updatedSettings.username) {
        console.log('updateSettingsMutation: Updating user table');
        const { error: userError } = await supabase
          .from('users')
          .update({
            username: updatedSettings.username || updatedSettings.fullName
          })
          .eq('id', user.id);
        
        if (userError) {
          console.error('updateSettingsMutation: User update error:', userError);
          throw userError;
        }
      }
      
      // Return the updated data with proper field mapping
      const resultData = {
        ...settings,
        ...updatedData,
        display_name: updatedData.display_name,
        displayName: updatedData.display_name,
        profile_image_url: updatedData.profile_image_url,
        avatar_url: updatedData.profile_image_url,
      };
      
      console.log('updateSettingsMutation: Returning updated data:', resultData);
      
      return resultData;
    },
    onSuccess: (data) => {
      console.log('updateSettingsMutation: Success callback, updating cache with:', data);
      queryClient.setQueryData(['creator-settings', user?.id], data);
      // Also invalidate related queries to refresh the profile
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails', user?.id] });
      refetch(); // Explicitly refetch to ensure we have the latest data
    },
    onError: (error: any) => {
      console.error('updateSettingsMutation: Error in mutation:', error);
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  });

  // Custom update function that accepts callbacks
  const updateSettings = (
    updatedSettings: Partial<CreatorSettings>, 
    callbacks?: { 
      onSuccess?: () => void; 
      onError?: (error: any) => void; 
    }
  ) => {
    console.log('updateSettings called with:', { updatedSettings, callbacks: !!callbacks });
    updateSettingsMutation.mutate(updatedSettings, {
      onSuccess: () => {
        console.log('updateSettings: Mutation success, calling callback');
        toast({
          title: "Success",
          description: "Your settings have been updated successfully",
        });
        callbacks?.onSuccess?.();
      },
      onError: (error) => {
        console.log('updateSettings: Mutation error, calling callback:', error);
        callbacks?.onError?.(error);
      }
    });
  };

  return {
    updateSettings
  };
};
