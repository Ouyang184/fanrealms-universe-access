
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, FileText, Heart, Eye, TrendingUp, Clock, Play, File, Download, FileImage, Lock } from "lucide-react";
import { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useNavigate } from "react-router-dom";

interface ContentItemProps {
  post: Post;
  type: 'trending' | 'new';
}

export function ContentItem({ post, type }: ContentItemProps) {
  const navigate = useNavigate();

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

  // Get file icon for different file types
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'video':
        return <Video className="h-8 w-8 text-blue-600" />;
      case 'image':
        return <FileImage className="h-8 w-8 text-green-600" />;
      default:
        return <File className="h-8 w-8 text-gray-600" />;
    }
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

  const contentType = determineContentType(post);
  const firstMedia = getFirstMedia(post.attachments);
  const thumbnail = getPostThumbnail(post);
  const hasVisualMedia = firstMedia && (firstMedia.type === 'image' || firstMedia.type === 'video');
  const hasFileAttachment = firstMedia && firstMedia.type !== 'image' && firstMedia.type !== 'video';
  const isPremium = !!post.tier_id;

  // Use real metadata from post - ensure we don't show "Unknown"
  const authorName = post.authorName || "Creator";
  const displayDate = post.createdAt ? formatRelativeDate(post.createdAt) : "Recently";
  const fileTypeLabel = firstMedia ? getFileTypeLabel(firstMedia.type) : null;

  const handleSubscribeClick = () => {
    // Use the correct property name from the Post type
    const creatorIdentifier = post.authorId;
    
    console.log('Subscribe button clicked for post:', {
      postId: post.id,
      authorId: post.authorId,
      selectedIdentifier: creatorIdentifier
    });
    
    if (creatorIdentifier) {
      // Navigate to creator's profile with membership tab active
      navigate(`/creator/${creatorIdentifier}?tab=membership`);
    } else {
      console.error('No creator identifier found for post:', post);
    }
  };

  return (
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
                // Hide broken images
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('hidden');
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
            
            {/* Premium lock overlay for visual media */}
            {isPremium && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-black/80 rounded-full p-3">
                  <Lock className="h-8 w-8 text-white/70" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* File attachment display with proper preview */}
        {hasFileAttachment && !hasVisualMedia && (
          <div className="relative w-full h-40 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              {getFileIcon(firstMedia.type)}
              <p className="text-sm text-gray-300 mt-2 px-4 truncate">
                {firstMedia.name || `${firstMedia.type.toUpperCase()} File`}
              </p>
              {fileTypeLabel && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span>{fileTypeLabel.icon}</span>
                  <span className="text-xs text-gray-400">{fileTypeLabel.label}</span>
                </div>
              )}
            </div>
            
            {/* Premium lock overlay for files */}
            {isPremium && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-black/80 rounded-full p-3">
                  <Lock className="h-8 w-8 text-white/70" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Text-only post display */}
        {!hasVisualMedia && !hasFileAttachment && (
          <div className="relative w-full h-40 bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-lg text-gray-200 line-clamp-4 font-medium">
                {post.title}
              </p>
              {post.content && post.content !== post.title && (
                <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                  {post.content}
                </p>
              )}
            </div>
            
            {/* Premium lock overlay for text posts */}
            {isPremium && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-black/80 rounded-full p-3">
                  <Lock className="h-8 w-8 text-white/70" />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Badges and metadata overlays */}
        <div className="absolute top-2 right-2">
          <Badge className={`flex items-center gap-1 ${type === 'trending' ? 'bg-orange-600' : 'bg-blue-600'}`}>
            {type === 'trending' ? <TrendingUp className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {type === 'trending' ? 'Trending' : 'New'}
          </Badge>
        </div>
        
        {/* File type indicator - Always show when there are attachments */}
        {firstMedia && (
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
            {fileTypeLabel && <span>{fileTypeLabel.icon}</span>}
            {contentType === "video" && <Video className="h-3 w-3" />}
            {(contentType === "image" || contentType === "file" || contentType === "pdf") && <FileText className="h-3 w-3" />}
            <span>{fileTypeLabel?.label || contentType}</span>
          </div>
        )}

        {/* Download indicator for file attachments */}
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
          <Badge className={`ml-auto ${isPremium ? 'bg-purple-600' : 'bg-green-600'}`}>
            {isPremium ? "Premium" : "Free"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button 
          size="sm" 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={handleSubscribeClick}
        >
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  );
}
