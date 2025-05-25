import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Play, FileText, File, FileImage, Video } from 'lucide-react';
import { formatRelativeDate } from '@/utils/auth-helpers';
import { PostAttachments } from './PostAttachments';
import { PostInteractions } from './post/PostInteractions';

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
  author_id?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  title,
  content,
  authorName,
  authorAvatar,
  createdAt,
  tier_id,
  attachments,
  users,
  author_id
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

  // Get file type label with icon
  const getFileTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return { icon: "📄", label: "PDF" };
      case 'video':
        return { icon: "🎥", label: "Video" };
      case 'image':
        return { icon: "🖼", label: "Image" };
      default:
        return { icon: "📎", label: "File" };
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'video':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'image':
        return <FileImage className="h-4 w-4 text-green-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const parsedAttachments = attachments ? (Array.isArray(attachments) ? attachments : []) : [];
  const firstMedia = getFirstMedia(attachments);
  
  // Use real metadata - avoid showing "Unknown"
  const displayAuthorName = authorName || users?.username || "Creator";
  const displayAvatar = authorAvatar || users?.profile_picture;
  const displayDate = createdAt ? formatRelativeDate(createdAt) : "Recently";
  const isPremium = !!tier_id;

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
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{content}</p>
          
          {/* Display media thumbnail with proper sizing and file type indication */}
          {firstMedia && (
            <div className="relative">
              {firstMedia.type === 'image' && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <img
                    src={firstMedia.url}
                    alt={firstMedia.name || "Media thumbnail"}
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: '1/1' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs flex items-center gap-1">
                    <span>🖼</span>
                    <span>Image</span>
                  </div>
                </div>
              )}
              
              {firstMedia.type === 'video' && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <img
                    src={firstMedia.url}
                    alt={firstMedia.name || "Video thumbnail"}
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: '1/1' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-black/70 rounded-full p-2">
                      <Play className="h-4 w-4 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs flex items-center gap-1">
                    <span>🎥</span>
                    <span>Video</span>
                  </div>
                </div>
              )}
              
              {firstMedia.type !== 'image' && firstMedia.type !== 'video' && (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30 w-fit">
                  {getFileIcon(firstMedia.type)}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-48">
                      {firstMedia.name || `${firstMedia.type.toUpperCase()} File`}
                    </span>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const fileLabel = getFileTypeLabel(firstMedia.type);
                        return (
                          <>
                            <span className="text-xs">{fileLabel.icon}</span>
                            <span className="text-xs text-muted-foreground">{fileLabel.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Display all attachments */}
          <PostAttachments attachments={parsedAttachments} />
        </div>
        
        {/* Add the interactions component with author ID */}
        <PostInteractions postId={id} authorId={author_id} />
      </CardContent>
    </Card>
  );
};

export default PostCard;
