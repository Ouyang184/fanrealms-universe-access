
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
      
      // First, let's verify the creator record exists
      const { data: existingCreator, error: checkError } = await supabase
        .from('creators')
        .select('id, user_id, display_name')
        .eq('id', settings.id)
        .single();
        
      if (checkError) {
        console.error('Error checking creator existence:', checkError);
        throw new Error('Failed to verify creator record');
      }
      
      if (!existingCreator) {
        console.error('No creator found with ID:', settings.id);
        throw new Error('Creator record not found');
      }
      
      console.log('Found existing creator for update:', existingCreator);
      
      // Prepare creator update data
      const creatorUpdateData: CreatorUpdateData = {
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
