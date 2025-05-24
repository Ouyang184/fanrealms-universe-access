
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FormLabel } from '@/components/ui/form';
import { Upload, X } from 'lucide-react';
import { ProfileData } from '@/hooks/useProfile';

interface ProfileImageUploadProps {
  profileData: ProfileData | null;
  userEmail?: string;
  selectedFile: File | null;
  previewUrl: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  profileData,
  userEmail,
  selectedFile,
  previewUrl,
  onImageChange,
  onClearImage
}) => {
  return (
    <div className="space-y-2">
      <FormLabel>Profile Picture</FormLabel>
      <div className="flex flex-col gap-4">
        {(previewUrl || profileData?.profile_picture) && (
          <div className="relative w-24 h-24">
            <Avatar className="w-24 h-24">
              <AvatarImage 
                src={previewUrl || profileData?.profile_picture} 
                alt="Profile preview"
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {profileData?.username?.charAt(0) || userEmail?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {previewUrl && (
              <button 
                type="button"
                onClick={onClearImage}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                aria-label="Remove image"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => document.getElementById('profile-image')?.click()}
            className="flex gap-2 items-center"
          >
            <Upload className="h-4 w-4" />
            {previewUrl ? "Change Image" : "Upload Image"}
          </Button>
          <input
            type="file"
            id="profile-image"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={onImageChange}
          />
          <span className="text-xs text-muted-foreground">PNG or JPG</span>
        </div>
      </div>
    </div>
  );
};
