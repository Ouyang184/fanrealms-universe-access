
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Crown, Globe } from "lucide-react";
import { Post } from "@/types";
import { PostCardMedia } from "@/components/post/PostCardMedia";

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

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-shadow bg-gray-900 border-gray-800 text-white overflow-hidden"
      onClick={handleClick}
    >
      {/* Media Section */}
      <div className="relative aspect-video bg-gray-800">
        <PostCardMedia attachments={post.attachments} />
        
        {/* Overlay badges */}
        <div className="absolute top-2 right-2 flex gap-2">
          {type === 'trending' && (
            <Badge className="bg-red-500/90 text-white">
              Trending
            </Badge>
          )}
          {type === 'new' && (
            <Badge className="bg-blue-500/90 text-white">
              New
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
          {post.title}
        </h3>
        
        {/* Content preview */}
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {post.content}
        </p>

        {/* Creator info and metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={avatarUrl} 
                alt={displayName} 
              />
              <AvatarFallback className="text-xs bg-gray-700 text-gray-300">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">{displayName}</span>
              {post.tier_id ? (
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-amber-100 text-purple-700 border-purple-200">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
          </div>

          {/* Engagement stats */}
          <div className="flex items-center gap-3 text-gray-400">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span className="text-xs">0</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">0</span>
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="mt-2">
          <span className="text-xs text-gray-500">{post.date}</span>
        </div>
      </CardContent>
    </Card>
  );
}
