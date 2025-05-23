
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
      console.log('Updated settings:', updatedSettings);
      
      // Prepare creator update data with only the fields that are actually changing
      const creatorUpdateData: Partial<CreatorUpdateData> = {};
      
      if (updatedSettings.bio !== undefined) creatorUpdateData.bio = updatedSettings.bio;
      if (updatedSettings.display_name !== undefined) creatorUpdateData.display_name = updatedSettings.display_name;
      if (updatedSettings.banner_url !== undefined) creatorUpdateData.banner_url = updatedSettings.banner_url;
      if (updatedSettings.profile_image_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.profile_image_url;
      if (updatedSettings.avatar_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.avatar_url;
      if (updatedSettings.tags !== undefined) creatorUpdateData.tags = updatedSettings.tags;

      console.log('Creator update data to send to DB:', creatorUpdateData);
      
      // Simple update without complex joins - just like Account Settings
      const { error: updateError } = await supabase
        .from('creators')
        .update(creatorUpdateData)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('Error updating creator:', updateError);
        throw updateError;
      }
      
      console.log('Creator updated successfully');
      
      // Let's verify the update actually worked by checking what's in the database immediately after
      const { data: verifyUpdate, error: verifyError } = await supabase
        .from('creators')
        .select('display_name, user_id')
        .eq('user_id', user.id)
        .single();
      
      console.log('VERIFICATION - What is actually in the database after update:', verifyUpdate);
      
      if (verifyError) {
        console.error('Error verifying update:', verifyError);
      }
      
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
      
      // Fetch the updated data separately - simple and reliable
      const { data: updatedCreator, error: fetchError } = await supabase
        .from('creators')
        .select('*, users:user_id(username, email)')
        .eq('user_id', user.id)
        .single();
      
      if (fetchError || !updatedCreator) {
        console.error('Error fetching updated creator:', fetchError);
        throw new Error('Failed to fetch updated creator data');
      }
      
      console.log('Successfully fetched updated creator from DB:', updatedCreator);
      
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
