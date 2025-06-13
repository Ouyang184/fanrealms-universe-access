
import React from 'react';
import { Play, FileText, File, FileImage, Video } from 'lucide-react';
import { parseVideoUrl, isVideoUrl } from '@/utils/videoUtils';

interface PostCardMediaProps {
  attachments: any;
}

export function PostCardMedia({ attachments }: PostCardMediaProps) {
  // Parse attachments from JSON and get first media item
  const getFirstMedia = (attachments: any) => {
    console.log('PostCardMedia - Raw attachments input:', attachments);
    
    if (!attachments) {
      console.log('PostCardMedia - No attachments provided');
      return null;
    }
    
    let parsedAttachments = [];
    if (typeof attachments === 'string' && attachments !== "undefined") {
      try {
        parsedAttachments = JSON.parse(attachments);
        console.log('PostCardMedia - Parsed string attachments:', parsedAttachments);
      } catch {
        console.log('PostCardMedia - Failed to parse string attachments');
        return null;
      }
    } else if (Array.isArray(attachments)) {
      parsedAttachments = attachments;
      console.log('PostCardMedia - Using array attachments:', parsedAttachments);
    } else if (attachments && typeof attachments === 'object' && attachments.value) {
      if (typeof attachments.value === 'string' && attachments.value !== "undefined") {
        try {
          parsedAttachments = JSON.parse(attachments.value);
          console.log('PostCardMedia - Parsed object.value attachments:', parsedAttachments);
        } catch {
          console.log('PostCardMedia - Failed to parse object.value attachments');
          return null;
        }
      } else if (Array.isArray(attachments.value)) {
        parsedAttachments = attachments.value;
        console.log('PostCardMedia - Using object.value array attachments:', parsedAttachments);
      }
    }

    if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
      const firstMedia = parsedAttachments[0];
      console.log('PostCardMedia - First media item:', firstMedia);
      return firstMedia;
    }
    
    console.log('PostCardMedia - No valid media found');
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

  if (!firstMedia) {
    console.log('PostCardMedia - No media to render, returning null');
    return null;
  }

  console.log('PostCardMedia - Processing media:', {
    type: firstMedia.type,
    url: firstMedia.url,
    name: firstMedia.name,
    size: firstMedia.size
  });

  // Check if this is a video URL that needs embedding (YouTube, Vimeo, etc.)
  const isEmbeddableVideoUrl = firstMedia.type === 'video' && isVideoUrl(firstMedia.url);
  
  console.log('PostCardMedia - Video URL check:', {
    isVideoType: firstMedia.type === 'video',
    isVideoUrl: isVideoUrl(firstMedia.url),
    isEmbeddableVideoUrl
  });
  
  // FIRST PRIORITY: Handle embeddable video URLs (YouTube, Vimeo, etc.)
  if (isEmbeddableVideoUrl) {
    const videoInfo = parseVideoUrl(firstMedia.url);
    console.log('PostCardMedia - Video parsing result:', videoInfo);
    
    if (videoInfo && videoInfo.platform !== 'unknown') {
      console.log('PostCardMedia - Rendering embedded video iframe for platform:', videoInfo.platform);
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

    // If we can't parse the video URL, don't render anything
    console.log('PostCardMedia - Video URL detected but platform unknown, blocking fallback');
    return null;
  }

  // SECOND PRIORITY: Handle image attachments
  if (firstMedia.type === 'image') {
    console.log('PostCardMedia - Rendering image attachment');
    return (
      <div className="relative mb-4">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
          <img
            src={firstMedia.url}
            alt={firstMedia.name || "Media thumbnail"}
            className="w-full h-full object-cover"
            style={{ aspectRatio: '1/1' }}
            onError={(e) => {
              console.log('PostCardMedia - Image failed to load:', firstMedia.url);
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs flex items-center gap-1">
            <span>🖼</span>
            <span>Image</span>
          </div>
        </div>
      </div>
    );
  }

  // THIRD PRIORITY: Handle uploaded video files (NOT URLs)
  // Only render HTML5 video player for actual uploaded video files with valid size
  if (firstMedia.type === 'video' && 
      !isVideoUrl(firstMedia.url) &&  // Must NOT be a URL
      firstMedia.url &&
      firstMedia.size &&
      typeof firstMedia.size === 'number' &&
      firstMedia.size > 0) {
    
    console.log('PostCardMedia - Rendering HTML5 video player for uploaded file:', {
      url: firstMedia.url,
      size: firstMedia.size,
      name: firstMedia.name,
      isVideoUrl: isVideoUrl(firstMedia.url)
    });
    
    return (
      <div className="relative mb-4">
        <div className="relative w-full rounded-lg overflow-hidden border">
          <video
            controls
            className="w-full max-h-80"
            preload="metadata"
            onError={(e) => {
              console.error('PostCardMedia - Video element error:', e);
            }}
            onLoadedMetadata={(e) => {
              console.log('PostCardMedia - Video metadata loaded:', {
                duration: e.currentTarget.duration,
                videoWidth: e.currentTarget.videoWidth,
                videoHeight: e.currentTarget.videoHeight
              });
            }}
          >
            <source src={firstMedia.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs flex items-center gap-1">
            <span>🎥</span>
            <span>Video File</span>
          </div>
        </div>
      </div>
    );
  }

  // FOURTH PRIORITY: Handle other file types (PDF, etc.)
  if (firstMedia.type !== 'image' && firstMedia.type !== 'video') {
    console.log('PostCardMedia - Rendering file attachment for type:', firstMedia.type);
    return (
      <div className="relative mb-4">
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
      </div>
    );
  }

  // If we get here, log what we couldn't handle
  console.log('PostCardMedia - No matching handler for media:', {
    type: firstMedia.type,
    isVideoUrl: isVideoUrl(firstMedia.url),
    hasSize: !!firstMedia.size,
    size: firstMedia.size
  });
  
  return null;
}
