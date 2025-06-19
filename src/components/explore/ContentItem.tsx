
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Crown, Globe } from "lucide-react";
import { Post } from "@/types";
import { PostCardMedia } from "@/components/post/PostCardMedia";
import { generatePostBanner, hasMediaContent } from "@/utils/postBanners";

interface ContentItemProps {
  post: Post;
  type: 'trending' | 'new';
  onPostClick?: (post: Post) => void;
}

export function ContentItem({ post, type, onPostClick }: ContentItemProps) {
  const handleClick = () => {
    if (onPostClick) {
      onPostClick(post);
    }
  };

  // Use the post's authorName and authorAvatar which should now be properly set from HomeContent
  const displayName = post.authorName || "Creator";
  const avatarUrl = post.authorAvatar || "/lovable-uploads/a88120a6-4c72-4539-b575-22350a7045c1.png";
  
  console.log('ContentItem: Rendering post with creator info:', {
    postId: post.id,
    postTitle: post.title,
    authorId: post.authorId,
    displayName,
    avatarUrl,
    originalAuthorName: post.authorName,
    originalAuthorAvatar: post.authorAvatar
  });

  // Check if post has media content
  const postHasMedia = hasMediaContent(post.attachments);

  // Responsive content preview with adaptive length
  const getPreviewContent = (content: string) => {
    if (!content) return "No content available";
    
    // Adaptive content length based on screen size
    const baseLength = 80; // Mobile
    const mdLength = 100;  // Tablet
    const lgLength = 120;  // Desktop
    
    // For now, use a medium length that works well across sizes
    const maxLength = 100;
    
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-800 text-white overflow-hidden"
      onClick={handleClick}
    >
      {/* Media Section or Banner */}
      <div className="relative aspect-video bg-gray-800">
        {postHasMedia ? (
          <PostCardMedia attachments={post.attachments} />
        ) : (
          <div 
            className="w-full h-full"
            style={{ background: generatePostBanner(post.title) }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
              <div className="text-center text-white max-w-full">
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold drop-shadow-lg line-clamp-2 break-words hyphens-auto">
                  {post.title}
                </h3>
              </div>
            </div>
          </div>
        )}
        
        {/* Overlay badges */}
        <div className="absolute top-2 right-2 flex gap-1 sm:gap-2">
          {type === 'trending' && (
            <Badge className="bg-red-500/90 text-white text-xs">
              Trending
            </Badge>
          )}
          {type === 'new' && (
            <Badge className="bg-blue-500/90 text-white text-xs">
              New
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Title - only show if media exists (since banner already shows title) */}
        {postHasMedia && (
          <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors break-words hyphens-auto">
            {post.title}
          </h3>
        )}
        
        {/* Content preview with responsive formatting */}
        <div className="space-y-2">
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3 break-words hyphens-auto">
            {getPreviewContent(post.content)}
          </p>
        </div>

        {/* Creator info and metadata */}
        <div className="flex items-center justify-between pt-1 sm:pt-2 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Avatar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0">
              <AvatarImage 
                src={avatarUrl} 
                alt={displayName} 
              />
              <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-medium text-gray-300 truncate">{displayName}</span>
              {post.tier_id ? (
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-amber-100 text-purple-700 border-purple-200 flex-shrink-0 text-xs scale-75 sm:scale-100 origin-left">
                  <Crown className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden xs:inline">Premium</span>
                  <span className="xs:hidden">P</span>
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 flex-shrink-0 text-xs scale-75 sm:scale-100 origin-left">
                  <Globe className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  <span className="hidden xs:inline">Public</span>
                  <span className="xs:hidden">P</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Engagement stats */}
          <div className="flex items-center gap-2 sm:gap-3 text-gray-400 flex-shrink-0">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs">0</span>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs">0</span>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="pt-0.5 sm:pt-1">
          <span className="text-xs text-gray-500">{post.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}
