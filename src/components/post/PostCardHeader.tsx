
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface PostCardHeaderProps {
  authorName: string;
  authorAvatar?: string | null;
  displayDate: string;
  isPremium: boolean;
  users?: {
    username?: string;
    profile_picture?: string;
  };
}

export function PostCardHeader({ 
  authorName, 
  authorAvatar, 
  displayDate, 
  isPremium,
  users 
}: PostCardHeaderProps) {
  const displayAuthorName = authorName || users?.username || "Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;

  return (
    <div className="flex items-start space-x-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={displayAvatar || undefined} alt={displayAuthorName} />
        <AvatarFallback>{displayAuthorName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{displayAuthorName}</p>
          <div className="flex items-center gap-2">
            {isPremium && (
              <Badge variant="secondary" className="text-xs">
                Premium
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              {displayDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
