
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Play, FileText, File } from 'lucide-react';
import { formatRelativeDate } from '@/utils/auth-helpers';
import { PostAttachments } from './PostAttachments';

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  date: string;
  tier_id?: string | null;
  attachments?: any;
  users?: {
    username?: string;
    profile_picture?: string;
  };
}

const PostCard: React.FC<PostCardProps> = ({
  title,
  content,
  authorName,
  authorAvatar,
  createdAt,
  tier_id,
  attachments,
  users
}) => {
  // Parse attachments from JSON and get first media item
  const getFirstMedia = (attachments: any) => {
    if (!attachments) return null;
    
    let parsedAttachments = [];
    if (typeof attachments === 'string' && attachments !== "undefined") {
      try {
        parsedAttachments = JSON.parse(attachments);
      } catch {
        return null;
      }
    } else if (Array.isArray(attachments)) {
      parsedAttachments = attachments;
    } else if (attachments && typeof attachments === 'object' && attachments.value) {
      if (typeof attachments.value === 'string' && attachments.value !== "undefined") {
        try {
          parsedAttachments = JSON.parse(attachments.value);
        } catch {
          return null;
        }
      } else if (Array.isArray(attachments.value)) {
        parsedAttachments = attachments.value;
      }
    }

    if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
      return parsedAttachments[0];
    }
    
    return null;
  };

  const parsedAttachments = attachments ? (Array.isArray(attachments) ? attachments : []) : [];
  const firstMedia = getFirstMedia(attachments);
  
  // Fix metadata display
  const displayAuthorName = authorName || users?.username || "Unknown Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;
  const displayDate = createdAt ? formatRelativeDate(createdAt) : "Recently";

  // Get file icon for different file types
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'video':
        return <Play className="h-4 w-4 text-blue-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={displayAvatar || undefined} alt={displayAuthorName} />
            <AvatarFallback>{displayAuthorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{displayAuthorName}</p>
              <div className="flex items-center gap-2">
                {tier_id && (
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
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{content}</p>
          
          {/* Display media thumbnail if available */}
          {firstMedia && (
            <div className="relative">
              {firstMedia.type === 'image' && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <img
                    src={firstMedia.url}
                    alt={firstMedia.name || "Media thumbnail"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {firstMedia.type === 'video' && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <img
                    src={firstMedia.url}
                    alt={firstMedia.name || "Video thumbnail"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-black/70 rounded-full p-2">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  </div>
                </div>
              )}
              
              {firstMedia.type !== 'image' && firstMedia.type !== 'video' && (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30 w-fit">
                  {getFileIcon(firstMedia.type)}
                  <span className="text-sm font-medium truncate max-w-48">
                    {firstMedia.name || `${firstMedia.type.toUpperCase()} File`}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Display all attachments */}
          <PostAttachments attachments={parsedAttachments} />
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
