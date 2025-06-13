
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

  // Early guard clause to prevent rendering broken video elements
  if (firstMedia.type === 'video' && !firstMedia.url) {
    return null;
  }

  // Check if this is a video URL that needs embedding (YouTube, Vimeo, etc.)
  const isEmbeddableVideoUrl = firstMedia.type === 'video' && isVideoUrl(firstMedia.url);
  
  if (isEmbeddableVideoUrl) {
    const videoInfo = parseVideoUrl(firstMedia.url);
    
    if (videoInfo && videoInfo.platform !== 'unknown') {
      return (
        <div className="relative w-full mb-4">
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

  // Handle non-URL media types (actual file attachments)
  return (
    <div className="relative mb-4">
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
      
      {/* Only show video player for actual video files that are NOT embeddable URLs and have valid file properties */}
      {firstMedia.type === 'video' && 
       firstMedia.url &&
       !isVideoUrl(firstMedia.url) &&
       firstMedia.size &&
       firstMedia.size > 0 && (
        <div className="relative w-full rounded-lg overflow-hidden border">
          <video
            controls
            className="w-full max-h-80"
            preload="metadata"
          >
            <source src={firstMedia.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs flex items-center gap-1">
            <span>🎥</span>
            <span>Video File</span>
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
