
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";

interface BannerUploadProps {
  userId: string;
  currentBannerUrl?: string | null;
  onBannerUpdate: (url: string) => void;
}

export function BannerUpload({ userId, currentBannerUrl, onBannerUpdate }: BannerUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PNG or JPG image.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const clearSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      console.log('Uploading banner to:', filePath);
      
      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, selectedFile, { upsert: true });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);
      
      console.log('Banner uploaded, public URL:', publicUrl);
      
      // Update creator profile in database
      const { error: updateError } = await supabase
        .from('creators')
        .update({ banner_url: publicUrl })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }
      
      console.log('Creator profile updated with banner URL');
      
      // Call the callback to update the parent component
      onBannerUpdate(publicUrl);
      
      toast({
        title: "Success",
        description: "Banner image updated successfully!"
      });
      
      // Clear the file selection but keep the preview
      setSelectedFile(null);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload banner image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview area */}
      <div className="relative">
        <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
          {(previewUrl || currentBannerUrl) ? (
            <img 
              src={previewUrl || currentBannerUrl || ''} 
              alt="Banner preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No banner image uploaded
            </div>
          )}
        </div>
        
        {/* Remove preview button */}
        {previewUrl && (
          <button
            onClick={clearSelectedImage}
            className="absolute top-2 right-2 p-1 bg-destructive rounded-full hover:bg-destructive/90"
            type="button"
            aria-label="Remove selected image"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      {/* Upload controls */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('banner-upload')?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {previewUrl ? "Change Banner" : "Upload Banner"}
        </Button>
        
        {selectedFile && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading && <LoadingSpinner className="mr-2" />}
            {isUploading ? "Uploading..." : "Save Banner"}
          </Button>
        )}
        
        <input
          type="file"
          id="banner-upload"
          className="hidden"
          accept="image/png, image/jpeg"
          onChange={handleFileSelect}
        />
        
        <span className="text-sm text-muted-foreground">
          PNG or JPG
        </span>
      </div>
    </div>
  );
}
