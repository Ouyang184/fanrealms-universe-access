import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, FileText, Heart, Eye, TrendingUp, Clock, Play, File, Download, FileImage, Lock, Crown } from "lucide-react";
import { Post } from "@/types";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PostCardMedia } from "@/components/post/PostCardMedia";
import { PostCardContent } from "@/components/post/PostCardContent";
import { parseVideoUrl, isVideoUrl } from "@/utils/videoUtils";

interface ContentItemProps {
  post: Post;
  type: 'trending' | 'new';
  onPostClick?: (post: Post) => void;
}

export function ContentItem({ post, type, onPostClick }: ContentItemProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // CREATOR-CENTRIC ACCESS LOGIC: Creators ALWAYS have full access to their own posts
  const isOwnPost = !!(user?.id && post.authorId && String(user.id) === String(post.authorId));
  const isPremium = !!post.tier_id;
  
  // CREATOR ALWAYS HAS FULL ACCESS - this matches the logic from PostCard.tsx
  const hasFullAccess = isOwnPost || !isPremium;
  
  console.log('[ContentItem] ENHANCED Creator access check:', {
    postId: post.id,
    postTitle: post.title,
    tierId: post.tier_id,
    authorId: post.authorId,
    userId: user?.id,
    isOwnPost,
    isPremium,
    hasFullAccess,
    finalDecision: hasFullAccess ? 'FULL_ACCESS_GRANTED' : 'ACCESS_RESTRICTED'
  });

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
  const hasVisualMedia = firstMedia && (firstMedia.type === 'image' || firstMedia.type === 'video');
  const hasFileAttachment = firstMedia && firstMedia.type !== 'image' && firstMedia.type !== 'video';

  // Use real metadata from post with better fallbacks
  const authorName = post.authorName && post.authorName !== 'Unknown' ? post.authorName : "Creator";
  const authorAvatar = post.authorAvatar || null;
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

  // Handle post click
  const handlePostClick = () => {
    if (onPostClick) {
      onPostClick(post);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 overflow-hidden cursor-pointer hover:bg-gray-800/50 transition-colors" onClick={handlePostClick}>
      <div className="relative">
        {/* Content banner area - always show content */}
        <div className="relative w-full h-40">
          {/* Show embedded video for video URLs */}
          {hasVisualMedia && firstMedia && firstMedia.type === 'video' && isVideoUrl(firstMedia.url) && (
            <>
              {(() => {
                const videoInfo = parseVideoUrl(firstMedia.url);
                if (videoInfo && videoInfo.platform !== 'unknown') {
                  return (
                    <div className="w-full h-full">
                      <iframe
                        src={videoInfo.embedUrl}
                        title={firstMedia.name || "Video"}
                        className="w-full h-full rounded-t-lg"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                }
                // Fallback for video URLs that can't be parsed
                return (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <Video className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-300">{firstMedia.name || "Video"}</p>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
          
          {/* Show image attachments */}
          {hasVisualMedia && firstMedia && firstMedia.type === 'image' && (
            <img
              src={firstMedia.url}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('hidden');
              }}
            />
          )}

          {/* Show uploaded video files (not URLs) */}
          {hasVisualMedia && firstMedia && firstMedia.type === 'video' && !isVideoUrl(firstMedia.url) && (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <Video className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-300">{firstMedia.name || "Video File"}</p>
              </div>
            </div>
          )}
          
          {/* Show file attachment preview */}
          {hasFileAttachment && !hasVisualMedia && (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
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
            </div>
          )}
          
          {/* Show post content for text-only posts */}
          {!hasVisualMedia && !hasFileAttachment && (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/80 to-blue-900/80 p-4 flex flex-col justify-center">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{post.title}</h3>
                {post.content && (
                  <p className="text-sm text-gray-200 line-clamp-3 leading-relaxed">
                    {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Premium lock overlay - ONLY for non-creators */}
          {isPremium && !hasFullAccess && !isOwnPost && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-black/80 rounded-full p-3">
                <Lock className="h-8 w-8 text-white/70" />
              </div>
            </div>
          )}
          
          {/* Creator's own premium content indicator - ONLY top-left badge */}
          {isPremium && hasFullAccess && isOwnPost && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <Crown className="h-3 w-3 mr-1" />
                Your Premium
              </Badge>
            </div>
          )}
        </div>
        
        {/* Badges and metadata overlays */}
        <div className="absolute top-2 right-2">
          <Badge className={`flex items-center gap-1 ${type === 'trending' ? 'bg-orange-600' : 'bg-blue-600'}`}>
            {type === 'trending' ? <TrendingUp className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {type === 'trending' ? 'Trending' : 'New'}
          </Badge>
        </div>
        
        {/* File type indicator - Show for non-embedded videos and other files */}
        {firstMedia && !(firstMedia.type === 'video' && isVideoUrl(firstMedia.url)) && (
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
              src={authorAvatar || `/placeholder.svg?text=${authorName.substring(0, 1)}`} 
              alt={authorName} 
            />
            <AvatarFallback className="text-xs">{authorName.substring(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-gray-400">{authorName}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold line-clamp-2 flex-1">{post.title}</h3>
        </div>
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
        {/* Show subscribe button for all posts */}
        <Button 
          size="sm" 
          className="bg-purple-600 hover:bg-purple-700"
          onClick={(e) => {
            e.stopPropagation();
            handleSubscribeClick();
          }}
        >
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  );
}
