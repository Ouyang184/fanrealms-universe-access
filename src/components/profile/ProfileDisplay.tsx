
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileData } from '@/hooks/useProfile';

interface ProfileDisplayProps {
  profileData: ProfileData;
  userEmail?: string;
  onEditClick: () => void;
}

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  profileData,
  userEmail,
  onEditClick
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profileData?.profile_picture || undefined} alt={profileData?.username || "User"} />
          <AvatarFallback className="text-lg">
            {profileData?.username?.charAt(0) || userEmail?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{profileData?.username}</h3>
          <p className="text-muted-foreground">@{profileData?.username}</p>
          {profileData?.website && (
            <a 
              href={profileData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm block mt-1"
            >
              {profileData.website}
            </a>
          )}
        </div>
      </div>

      {profileData?.bio && (
        <div>
          <h4 className="text-sm font-medium mb-2">Bio</h4>
          <p className="text-muted-foreground">{profileData.bio}</p>
        </div>
      )}

      {profileData?.tags && profileData.tags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Content Tags</h4>
          <div className="flex flex-wrap gap-2">
            {profileData.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="px-3 py-1">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3">
        <div>
          <h4 className="text-sm font-medium">Email</h4>
          <p className="text-muted-foreground">{profileData?.email || userEmail}</p>
        </div>
      </div>
      <Button 
        onClick={onEditClick}
        variant="outline"
        className="mt-4"
      >
        Edit Profile
      </Button>
    </div>
  );
};
