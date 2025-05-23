
import { useCreatorSettingsQuery } from './useCreatorSettingsQuery';
import { useCreatorSettingsMutation } from './useCreatorSettingsMutation';
import { useProfileImageUpload } from './useProfileImageUpload';

export const useCreatorSettings = () => {
  const { settings, isLoading, refetch } = useCreatorSettingsQuery();
  const { updateSettings } = useCreatorSettingsMutation(settings, refetch);
  const { uploadProfileImage, isUploading } = useProfileImageUpload();

  return {
    settings,
    isLoading,
    isUploading,
    updateSettings,
    uploadProfileImage,
    refetch
  };
};
