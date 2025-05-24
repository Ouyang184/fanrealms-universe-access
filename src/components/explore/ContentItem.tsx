
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, FileText, Heart, Eye, TrendingUp, Clock, Play, File, Download } from "lucide-react";
import { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useState } from "react";
import { PostPreviewModal } from "./PostPreviewModal";

interface ContentItemProps {
  post: Post;
  type: 'trending' | 'new';
}

export function ContentItem({ post, type }: ContentItemProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Helper function to get the first media from attachments
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

  // Helper functions to determine content type
  const determineContentType = (post: Post) => {
    const firstMedia = getFirstMedia(post.attachments);
    if (firstMedia) {
      return firstMedia.type || "file";
    }
    
    if (!post || !post.content) return "post";
    if (post.content.includes('youtube.com') || post.content.includes('vimeo.com')) {
      return "video";
    } else if (post.content.length > 1000) {
      return "article";
    } else {
      return "post";
    }
  };
  
  // Generate thumbnail for post with proper sizing
  const getPostThumbnail = (post: Post) => {
    const firstMedia = getFirstMedia(post.attachments);
    
    if (firstMedia && firstMedia.url) {
      // For images and videos, show the actual media
      if (firstMedia.type === 'image' || firstMedia.type === 'video') {
        return firstMedia.url;
      }
    }
    
    // For posts without visual media, return null to show text-only card
    return null;
  };

  // Get file icon for non-image/video files
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'video':
        return <Video className="h-8 w-8 text-blue-600" />;
      case 'image':
        return <FileText className="h-8 w-8 text-green-600" />;
      default:
        return <File className="h-8 w-8 text-gray-600" />;
    }
  };

  const contentType = determineContentType(post);
  const firstMedia = getFirstMedia(post.attachments);
  const thumbnail = getPostThumbnail(post);
  const hasVisualMedia = firstMedia && (firstMedia.type === 'image' || firstMedia.type === 'video');
  const hasFileAttachment = firstMedia && firstMedia.type !== 'image' && firstMedia.type !== 'video';

  // Use real metadata from post
  const authorName = post.authorName || "Unknown Creator";
  const displayDate = post.createdAt ? formatRelativeDate(post.createdAt) : "Recently";

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="relative">
          {/* Visual media thumbnail with proper aspect ratio */}
          {hasVisualMedia && thumbnail && (
            <div className="relative w-full h-40">
              <img
                src={thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
                style={{ aspectRatio: '16/9' }}
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Video play overlay */}
              {firstMedia?.type === 'video' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="bg-black/70 rounded-full p-3">
                    <Play className="h-6 w-6 text-white fill-white" />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* File attachment display with real filename */}
          {hasFileAttachment && !hasVisualMedia && (
            <div className="relative w-full h-40 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                {getFileIcon(firstMedia.type)}
                <p className="text-sm text-gray-300 mt-2 px-4 truncate">
                  {firstMedia.name || `${firstMedia.type.toUpperCase()} File`}
                </p>
              </div>
            </div>
          )}
          
          {/* Text-only post display */}
          {!hasVisualMedia && !hasFileAttachment && (
            <div className="relative w-full h-40 bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center p-4">
              <div className="text-center">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-300 line-clamp-3">
                  {post.content || post.title}
                </p>
              </div>
            </div>
          )}
          
          {/* Badges and metadata overlays */}
          <div className="absolute top-2 right-2">
            <Badge className={`flex items-center gap-1 ${type === 'trending' ? 'bg-orange-600' : 'bg-blue-600'}`}>
              {type === 'trending' ? <TrendingUp className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {type === 'trending' ? 'Trending' : 'New'}
            </Badge>
          </div>
          
          {/* Content type indicator */}
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
            {contentType === "video" && <Video className="h-3 w-3" />}
            {(contentType === "image" || contentType === "file" || contentType === "pdf") && <FileText className="h-3 w-3" />}
            {contentType === "article" && <FileText className="h-3 w-3" />}
            {contentType === "post" && <FileText className="h-3 w-3" />}
            {contentType}
          </div>

          {/* Only show download indicator for actual file attachments */}
          {hasFileAttachment && (
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
              <Download className="h-3 w-3" />
              Download
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={post.authorAvatar || `/placeholder.svg?text=${authorName.substring(0, 1)}`} 
                alt={authorName} 
              />
              <AvatarFallback className="text-xs">{authorName.substring(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-400">{authorName}</span>
          </div>
          <h3 className="font-semibold line-clamp-2">{post.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {displayDate}
            </div>
            <Badge className="ml-auto bg-purple-600">{post.tier_id ? "Premium" : "Free"}</Badge>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-purple-400 p-0"
            onClick={() => setShowPreview(true)}
          >
            Preview
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
            Subscribe
          </Button>
        </CardFooter>
      </Card>

      <PostPreviewModal 
        open={showPreview}
        onOpenChange={setShowPreview}
        post={post}
      />
    </>
  );
}
