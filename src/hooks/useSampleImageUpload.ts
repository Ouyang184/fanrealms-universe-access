
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function useSampleImageUpload() {
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [sampleImagePreview, setSampleImagePreview] = useState<string | null>(null);
  const [uploadingSample, setUploadingSample] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSampleImage(file);
      const preview = URL.createObjectURL(file);
      setSampleImagePreview(preview);
    }
  };

  const removeSampleImage = () => {
    setSampleImage(null);
    setSampleImagePreview(null);
  };

  const uploadSampleImage = async (creatorProfileId: string): Promise<string | null> => {
    if (!sampleImage) return null;

    setUploadingSample(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = sampleImage.name.split('.').pop();
      const fileName = `commission-sample-${creatorProfileId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/commission-samples/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-attachments')
        .upload(filePath, sampleImage);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('post-attachments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading sample image:', error);
      toast({
        title: "Error",
        description: "Failed to upload sample image",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingSample(false);
    }
  };

  const resetImageUpload = () => {
    setSampleImage(null);
    setSampleImagePreview(null);
  };

  return {
    sampleImage,
    sampleImagePreview,
    uploadingSample,
    handleImageUpload,
    removeSampleImage,
    uploadSampleImage,
    resetImageUpload
  };
}
