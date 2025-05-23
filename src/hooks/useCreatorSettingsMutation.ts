
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
      
      console.log('=== COMPREHENSIVE UPDATE DEBUG ===');
      console.log('User ID:', user.id);
      console.log('Input settings to update:', updatedSettings);
      
      // First, let's check current database state
      const { data: beforeUpdate, error: beforeError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (beforeError) {
        console.error('Error fetching before update:', beforeError);
        throw new Error('Could not find creator record');
      }
      
      console.log('DATABASE STATE BEFORE UPDATE:', beforeUpdate);
      
      // Prepare only the fields that are changing
      const creatorUpdateData: Partial<CreatorUpdateData> = {};
      
      if (updatedSettings.bio !== undefined) creatorUpdateData.bio = updatedSettings.bio;
      if (updatedSettings.display_name !== undefined) creatorUpdateData.display_name = updatedSettings.display_name;
      if (updatedSettings.banner_url !== undefined) creatorUpdateData.banner_url = updatedSettings.banner_url;
      if (updatedSettings.profile_image_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.profile_image_url;
      if (updatedSettings.avatar_url !== undefined) creatorUpdateData.profile_image_url = updatedSettings.avatar_url;
      if (updatedSettings.tags !== undefined) creatorUpdateData.tags = updatedSettings.tags;

      console.log('EXACT UPDATE PAYLOAD:', creatorUpdateData);
      console.log('display_name specifically:', creatorUpdateData.display_name);
      
      // Execute the update
      const { error: updateError } = await supabase
        .from('creators')
        .update(creatorUpdateData)
        .eq('user_id', user.id);
      
      if (updateError) {
        console.error('UPDATE FAILED:', updateError);
        throw updateError;
      }
      
      console.log('UPDATE COMMAND EXECUTED WITHOUT ERROR');
      
      // Wait a moment and then verify the update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: afterUpdate, error: afterError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (afterError || !afterUpdate) {
        console.error('Error fetching after update:', afterError);
        throw new Error('Update verification failed');
      }
      
      console.log('DATABASE STATE AFTER UPDATE:', afterUpdate);
      console.log('display_name after update:', afterUpdate.display_name);
      
      // Check if the display_name actually changed
      if (creatorUpdateData.display_name !== undefined && afterUpdate.display_name !== creatorUpdateData.display_name) {
        console.error('CRITICAL: Display name did not update!');
        console.error('Expected:', creatorUpdateData.display_name);
        console.error('Actual:', afterUpdate.display_name);
        throw new Error(`Update failed: display_name should be "${creatorUpdateData.display_name}" but is "${afterUpdate.display_name}"`);
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
        }
      }
      
      // Fetch the final data with user info
      const { data: finalCreator, error: finalError } = await supabase
        .from('creators')
        .select('*, users:user_id(username, email)')
        .eq('user_id', user.id)
        .single();
      
      if (finalError || !finalCreator) {
        console.error('Error fetching final creator:', finalError);
        throw new Error('Failed to fetch updated creator data');
      }
      
      console.log('FINAL CREATOR DATA FROM DB:', finalCreator);
      
      // Format and return the updated data
      const formattedData = formatCreatorData(finalCreator);
      console.log('FORMATTED DATA TO RETURN:', formattedData);
      
      return formattedData;
    },
    onSuccess: (updatedData) => {
      console.log('MUTATION SUCCESS - FINAL DATA:', updatedData);
      
      // Clear and set the cache
      queryClient.removeQueries({ queryKey: ['creator-settings', user?.id] });
      queryClient.setQueryData(['creator-settings', user?.id], updatedData);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['creatorProfile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creatorProfileDetails', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['creator-profile', user?.id] });
      
      toast({
        title: "Success",
        description: "Your settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('MUTATION ERROR:', error);
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
