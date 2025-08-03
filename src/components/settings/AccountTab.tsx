import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';
import { useUnifiedAvatar } from '@/hooks/useUnifiedAvatar';
import { useToast } from '@/hooks/use-toast';

interface AccountTabProps {
  user: any;
  profile: any;
}

export function AccountTab({ user, profile }: AccountTabProps) {
  const { getAvatarUrl, uploadAvatar } = useUnifiedAvatar();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to update your profile picture",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
        <CardDescription>
          Manage your account details and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage 
              src={getAvatarUrl(profile) || ""} 
              alt="Profile picture" 
            />
            <AvatarFallback className="text-xl">
              {profile?.username?.substring(0, 1).toUpperCase() || user?.email?.substring(0, 1).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
            className="flex items-center gap-2"
          >
            <Camera className={`h-4 w-4 ${uploadingAvatar ? 'animate-spin' : ''}`} />
            {uploadingAvatar ? "Uploading..." : "Change Avatar"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        
        {/* User Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
              {profile?.username || 'Not set'}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
              {user?.email}
            </div>
          </div>
          
          <div className="pt-4">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}