
import { useCreatorSettingsQuery } from './useCreatorSettingsQuery';
import { useProfileImageUpload } from './useProfileImageUpload';

export const useCreatorSettings = () => {
  const { settings, isLoading, refetch } = useCreatorSettingsQuery();
  const { uploadProfileImage, isUploading } = useProfileImageUpload();

  return {
    settings,
    isLoading,
    isUploading,
    uploadProfileImage,
    refetch
  };
};
