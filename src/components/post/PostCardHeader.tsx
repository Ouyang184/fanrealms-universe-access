
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Lock, Globe } from 'lucide-react';

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
  const finalAuthorName = authorName || users?.username || "Creator";
  const finalAvatar = authorAvatar || users?.profile_picture;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={finalAvatar || undefined} alt={finalAuthorName} />
          <AvatarFallback>{finalAuthorName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-3">
            <p className="font-medium text-sm">{finalAuthorName}</p>
            {isPremium ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Lock className="h-3 w-3 mr-1" />
                Members only
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{displayDate}</p>
        </div>
      </div>
    </div>
  );
}
