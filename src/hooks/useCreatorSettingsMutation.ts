
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
      
      console.log('=== DEBUGGING DATABASE UPDATE ISSUE ===');
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
      
      // Let's try a very simple, direct update approach
      console.log('Attempting to update display_name to:', updatedSettings.display_name);
      
      // Try the most basic update possible
      const { data: updateResult, error: updateError } = await supabase
        .from('creators')
        .update({ 
          display_name: updatedSettings.display_name 
        })
        .eq('user_id', user.id)
        .select('*')
        .single();
      
      console.log('UPDATE RESULT:', updateResult);
      console.log('UPDATE ERROR:', updateError);
      
      if (updateError) {
        console.error('UPDATE FAILED WITH ERROR:', updateError);
        throw updateError;
      }
      
      // Double check what's actually in the database now
      const { data: afterUpdate, error: afterError } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('DATABASE STATE AFTER UPDATE:', afterUpdate);
      
      if (afterError) {
        console.error('Error fetching after update:', afterError);
        throw new Error('Update verification failed');
      }
      
      // Check if the update actually worked
      if (updatedSettings.display_name !== undefined && 
          afterUpdate.display_name !== updatedSettings.display_name) {
        console.error('CRITICAL: Database update did not persist!');
        console.error('Expected:', updatedSettings.display_name);
        console.error('Actual in DB:', afterUpdate.display_name);
        
        // Let's try to understand why - check for triggers or constraints
        console.log('Checking for potential database constraints or triggers...');
        
        throw new Error(`Database update failed to persist. Expected "${updatedSettings.display_name}" but got "${afterUpdate.display_name}"`);
      }
      
      // If we get here, the update worked
      console.log('✅ Update successful! display_name is now:', afterUpdate.display_name);
      
      // Update other fields if provided
      if (Object.keys(updatedSettings).length > 1 || !updatedSettings.display_name) {
        const otherUpdates: Partial<CreatorUpdateData> = {};
        
        if (updatedSettings.bio !== undefined) otherUpdates.bio = updatedSettings.bio;
        if (updatedSettings.banner_url !== undefined) otherUpdates.banner_url = updatedSettings.banner_url;
        if (updatedSettings.profile_image_url !== undefined) otherUpdates.profile_image_url = updatedSettings.profile_image_url;
        if (updatedSettings.avatar_url !== undefined) otherUpdates.profile_image_url = updatedSettings.avatar_url;
        if (updatedSettings.tags !== undefined) otherUpdates.tags = updatedSettings.tags;

        if (Object.keys(otherUpdates).length > 0) {
          console.log('Updating other fields:', otherUpdates);
          
          const { error: otherUpdateError } = await supabase
            .from('creators')
            .update(otherUpdates)
            .eq('user_id', user.id);
          
          if (otherUpdateError) {
            console.error('Error updating other fields:', otherUpdateError);
            throw otherUpdateError;
          }
        }
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
