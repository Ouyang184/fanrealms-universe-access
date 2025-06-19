
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { parseVideoUrl, isVideoUrl } from "@/utils/videoUtils";
import { Post } from "@/types";

interface PostPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
}

export function PostPreviewModal({ open, onOpenChange, post }: PostPreviewModalProps) {
  if (!post) return null;

  // Enhanced attachment parsing to handle different data formats
  const parseAttachments = (attachments: any) => {
    if (!attachments) {
      return [];
    }
    
    // Handle the specific case where attachments have _type and value properties
    if (attachments && typeof attachments === 'object' && attachments._type !== undefined) {
      // If the value is "undefined" string or actual undefined, return empty array
      if (attachments.value === "undefined" || attachments.value === undefined || attachments.value === null) {
        return [];
      }
      // Try to parse the value if it's a string
      if (typeof attachments.value === 'string' && attachments.value !== "undefined") {
        try {
          const parsed = JSON.parse(attachments.value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [];
        }
      }
      // If value is already an array, return it
      if (Array.isArray(attachments.value)) {
        return attachments.value;
      }
    }
    
    // If it's already an array, return it
    if (Array.isArray(attachments)) {
      return attachments;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof attachments === 'string' && attachments !== "undefined") {
      try {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    
    // If it's an object (but not the _type structure), wrap it in an array
    if (typeof attachments === 'object') {
      return [attachments];
    }
    
    return [];
  };

  const parsedAttachments = parseAttachments(post.attachments);
  
  // Separate images, videos, and embeddable videos
  const images = parsedAttachments.filter(att => 
    att && att.type === 'image' && att.url
  );
  
  const embeddableVideos = parsedAttachments.filter(att => 
    att && att.type === 'video' && att.url && isVideoUrl(att.url)
  );
  
  const uploadedVideos = parsedAttachments.filter(att => 
    att && att.type === 'video' && att.url && !isVideoUrl(att.url)
  );
  
  const hasMedia = images.length > 0 || embeddableVideos.length > 0 || uploadedVideos.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorAvatar || undefined} alt={post.authorName} />
              <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{post.authorName}</span>
                {post.tier_id && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatRelativeDate(post.createdAt)}
              </p>
            </div>
          </div>
          <DialogTitle className="text-left text-xl">{post.title}</DialogTitle>
          <DialogDescription className="text-left">
            {post.content}
          </DialogDescription>
        </DialogHeader>

        {/* Display media attachments */}
        {hasMedia && (
          <div className="my-6 space-y-4">
            {/* Embeddable Videos (YouTube, Vimeo, etc.) */}
            {embeddableVideos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Videos ({embeddableVideos.length})
                </h4>
                <div className="space-y-3">
                  {embeddableVideos.map((video, index) => {
                    const videoInfo = parseVideoUrl(video.url);
                    if (!videoInfo || videoInfo.platform === 'unknown') return null;
                    
                    return (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="aspect-video w-full">
                          <iframe
                            src={videoInfo.embedUrl}
                            title={video.name || `Video ${index + 1}`}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="p-3 bg-muted/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {video.name || `${videoInfo.platform} Video`}
                            </span>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {videoInfo.platform}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Uploaded Videos */}
            {uploadedVideos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Uploaded Videos ({uploadedVideos.length})
                </h4>
                <div className="space-y-3">
                  {uploadedVideos.map((video, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full max-h-96"
                        preload="metadata"
                      >
                        <source src={video.url} type="video/mp4" />
                        <source src={video.url} type="video/webm" />
                        <source src={video.url} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {video.name || `Video ${index + 1}`}
                          </span>
                          {video.size && (
                            <Badge variant="secondary" className="text-xs">
                              {(video.size / (1024 * 1024)).toFixed(1)} MB
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {images.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Images ({images.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.name || `Image ${index + 1}`}
                        className="w-full max-h-80 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(image.url, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(image.url, '_blank');
                          }}
                          className="bg-white/90 hover:bg-white"
                        >
                          View Full Size
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {post.tier_id ? 'Premium content' : 'Free content'}
              {hasMedia && (
                <span className="ml-2">
                  • {images.length + embeddableVideos.length + uploadedVideos.length} attachment{images.length + embeddableVideos.length + uploadedVideos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Visit Creator Page
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
