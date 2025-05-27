
import React from 'react';
import { Play, FileText, File, FileImage, Video } from 'lucide-react';
import { parseVideoUrl, isVideoUrl } from '@/utils/videoUtils';

interface PostCardMediaProps {
  attachments: any;
}

export function PostCardMedia({ attachments }: PostCardMediaProps) {
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

  const firstMedia = getFirstMedia(attachments);

  if (!firstMedia) return null;

  // Check if this is a video URL that needs embedding
  if (firstMedia.type === 'video' && isVideoUrl(firstMedia.url)) {
    const videoInfo = parseVideoUrl(firstMedia.url);
    
    if (videoInfo && videoInfo.platform !== 'unknown') {
      return (
        <div className="relative w-full">
          <div className="aspect-video w-full rounded-lg overflow-hidden border">
            <iframe
              src={videoInfo.embedUrl}
              title={firstMedia.name || "Video"}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
            <Video className="h-3 w-3" />
            <span className="capitalize">{videoInfo.platform}</span>
          </div>
        </div>
      );
    }
  }

  return (
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
      
      {firstMedia.type === 'video' && !isVideoUrl(firstMedia.url) && (
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
  );
}
