
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function useSampleImageUpload() {
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [sampleImagePreview, setSampleImagePreview] = useState<string | null>(null);
  const [uploadingSample, setUploadingSample] = useState(false);

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE_MB = 10;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, WebP, or GIF image.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Image must be smaller than ${MAX_SIZE_MB}MB.`, variant: 'destructive' });
      return;
    }
    setSampleImage(file);
    const preview = URL.createObjectURL(file);
    setSampleImagePreview(preview);
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

      // Store only the storage path; resolve signed URL at view time
      return filePath;
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
