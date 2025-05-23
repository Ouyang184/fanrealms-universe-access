
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CreatorSettingsData, CreatorUpdateData } from '@/types/creator-settings';
import { formatCreatorData } from '@/utils/creatorDataFormatter';

export const useCreatorSettingsMutation = (settings: CreatorSettingsData | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<CreatorSettingsData>) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!settings?.id) throw new Error('No creator ID found');
      
      console.log('=== UPDATE DEBUG INFO ===');
      console.log('User ID:', user.id);
      console.log('Settings ID:', settings.id);
      console.log('Settings user_id:', settings.user_id);
      console.log('New display_name:', updatedSettings.display_name);
      
      // First verify the record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('creators')
        .select('id, user_id, display_name')
        .eq('id', settings.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing record:', checkError);
        throw checkError;
      }
      
      if (!existingRecord) {
        console.error('No creator record found with ID:', settings.id);
        throw new Error('Creator record not found');
      }
      
      console.log('Found existing record:', existingRecord);
      
      // Prepare creator update data with only the fields that are actually changing
      const creatorUpdateData: Partial<CreatorUpdateData> = {};
      
      if (updatedSettings.bio !== undefined) creatorUpdateData.bio = updatedSettings.bio;
      if (updatedSettings.display_name !== undefined) creatorUpdateData.display_name = updatedSettings.display_name;
      if (updatedSettings.banner_url !== undefined) creatorUpdateData.banner_url = updatedSettings.banner_url;
      if (updatedSettings.profile_image_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.profile_image_url;
      if (updatedSettings.avatar_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.avatar_url;
      if (updatedSettings.tags !== undefined) creatorUpdateData.tags = updatedSettings.tags;

      console.log('Creator update data:', creatorUpdateData);
      
      // Perform the update with a more specific query
      const { data: updatedCreator, error: updateError } = await supabase
        .from('creators')
        .update(creatorUpdateData)
        .eq('id', settings.id)
        .eq('user_id', user.id) // Additional safety check
        .select('*, users:user_id(username, email)')
        .single();
      
      if (updateError) {
        console.error('Error updating creator:', updateError);
        throw updateError;
      }
      
      if (!updatedCreator) {
        console.error('No creator record was updated - this should not happen with .single()');
        throw new Error('Failed to update creator record');
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
      
      toast({
        title: "Success",
        description: "Your settings have been updated successfully",
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

  return {
    updateSettings: (updatedSettings: Partial<CreatorSettingsData>, options?: any) => 
      updateSettingsMutation.mutate(updatedSettings, options)
  };
};
