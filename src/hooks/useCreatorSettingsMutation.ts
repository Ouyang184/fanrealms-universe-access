
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
      
      console.log('=== UPDATE DEBUG INFO ===');
      console.log('User ID:', user.id);
      console.log('Settings:', settings);
      console.log('Updated settings:', updatedSettings);
      
      // First, let's find the creator record by user_id (most reliable approach)
      const { data: existingCreator, error: findError } = await supabase
        .from('creators')
        .select('id, user_id, display_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (findError) {
        console.error('Error finding creator:', findError);
        throw findError;
      }
      
      if (!existingCreator) {
        console.error('No creator found for user_id:', user.id);
        throw new Error('Creator profile not found. Please refresh the page.');
      }
      
      console.log('Found creator:', existingCreator);
      
      // Prepare creator update data with only the fields that are actually changing
      const creatorUpdateData: Partial<CreatorUpdateData> = {};
      
      if (updatedSettings.bio !== undefined) creatorUpdateData.bio = updatedSettings.bio;
      if (updatedSettings.display_name !== undefined) creatorUpdateData.display_name = updatedSettings.display_name;
      if (updatedSettings.banner_url !== undefined) creatorUpdateData.banner_url = updatedSettings.banner_url;
      if (updatedSettings.profile_image_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.profile_image_url;
      if (updatedSettings.avatar_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.avatar_url;
      if (updatedSettings.tags !== undefined) creatorUpdateData.tags = updatedSettings.tags;

      console.log('Creator update data:', creatorUpdateData);
      
      // Perform the update using the creator ID we found
      const { data: updatedCreator, error: updateError } = await supabase
        .from('creators')
        .update(creatorUpdateData)
        .eq('id', existingCreator.id)
        .select('*, users:user_id(username, email)')
        .maybeSingle();
      
      if (updateError) {
        console.error('Error updating creator:', updateError);
        throw updateError;
      }
      
      if (!updatedCreator) {
        console.error('No creator record was returned after update');
        throw new Error('Failed to update creator record');
      }
      
      console.log('Successfully updated creator:', updatedCreator);
      
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
