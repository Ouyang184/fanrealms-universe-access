
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatCreatorData } from '@/utils/creatorDataFormatter';
import { useCreatorImageUpload } from '@/hooks/useCreatorImageUpload';
import { useCreatorSettingsMutation } from '@/hooks/useCreatorSettingsMutation';

export const useCreatorSettings = () => {
  const { user } = useAuth();
  const { isUploading, uploadProfileImage } = useCreatorImageUpload();

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

  const { updateSettings } = useCreatorSettingsMutation(settings);

  return {
    settings,
    isLoading,
    isUploading,
    updateSettings,
    uploadProfileImage
  };
};
