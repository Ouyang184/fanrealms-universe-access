
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatCreatorData } from '@/utils/creatorDataFormatter';
import { useCreatorImageUpload } from '@/hooks/useCreatorImageUpload';
import { useCreatorSettingsMutation } from '@/hooks/useCreatorSettingsMutation';

export const useCreatorSettings = (creatorId?: string) => {
  const { user } = useAuth();
  const { isUploading, uploadProfileImage } = useCreatorImageUpload();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['creator-settings', creatorId || user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log('Fetching creator settings for:', { creatorId, userId: user.id });
      
      let creatorQuery;
      
      if (creatorId) {
        // Fetch by creator ID
        creatorQuery = supabase
          .from('creators')
          .select('*, users:user_id(username, email)')
          .eq('id', creatorId)
          .maybeSingle();
      } else {
        // Fetch by user ID (for current user's creator profile)
        creatorQuery = supabase
          .from('creators')
          .select('*, users:user_id(username, email)')
          .eq('user_id', user.id)
          .maybeSingle();
      }
      
      const { data: creator, error: creatorError } = await creatorQuery;
        
      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
        return null;
      }
      
      // If no creator exists and we're fetching for current user, create one
      if (!creator && !creatorId) {
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
      
      if (!creator) {
        console.log('Creator not found');
        return null;
      }
      
      console.log('Found creator:', creator);
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
