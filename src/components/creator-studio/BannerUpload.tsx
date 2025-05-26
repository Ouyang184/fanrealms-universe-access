
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { useCreatorImageUpload } from "@/hooks/useCreatorImageUpload";
import LoadingSpinner from "@/components/LoadingSpinner";

interface BannerUploadProps {
  userId: string;
  currentBannerUrl?: string | null;
  onBannerUpdate: (url: string) => void;
}

export function BannerUpload({ userId, currentBannerUrl, onBannerUpdate }: BannerUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { uploadBannerImage, isUploading } = useCreatorImageUpload();

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
      const publicUrl = await uploadBannerImage(selectedFile);
      
      if (publicUrl) {
        // Call the callback to update the parent component
        onBannerUpdate(publicUrl);
        
        toast({
          title: "Success",
          description: "Banner image updated successfully!"
        });
        
        // Clear the file selection and update preview
        setSelectedFile(null);
        setPreviewUrl(null);
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload banner image",
        variant: "destructive"
      });
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
