
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Crown, Globe, Eye, Heart, MessageCircle } from "lucide-react";
import { Post } from "@/types";

interface ContentItemProps {
  post: Post;
  type: 'trending' | 'new';
}

export function ContentItem({ post, type }: ContentItemProps) {
  const isPremiumPost = !!post.tier_id;
  
  // Get the first image/video from attachments for thumbnail
  const getThumbnail = () => {
    if (!post.attachments) return null;
    
    let parsedAttachments = [];
    if (typeof post.attachments === 'string' && post.attachments !== "undefined") {
      try {
        parsedAttachments = JSON.parse(post.attachments);
      } catch {
        return null;
      }
    } else if (Array.isArray(post.attachments)) {
      parsedAttachments = post.attachments;
    } else if (post.attachments && typeof post.attachments === 'object' && post.attachments.value) {
      if (typeof post.attachments.value === 'string' && post.attachments.value !== "undefined") {
        try {
          parsedAttachments = JSON.parse(post.attachments.value);
        } catch {
          return null;
        }
      } else if (Array.isArray(post.attachments.value)) {
        parsedAttachments = post.attachments.value;
      }
    }

    if (Array.isArray(parsedAttachments) && parsedAttachments.length > 0) {
      const firstMedia = parsedAttachments.find(att => att.type === 'image' || att.type === 'video');
      return firstMedia?.url || null;
    }
    
    return null;
  };

  const thumbnailUrl = getThumbnail();
  
  // Ensure we have proper author information
  const authorName = post.authorName || 'Creator';
  const authorAvatar = post.authorAvatar;

  console.log('ContentItem: Rendering with author info:', {
    postId: post.id,
    title: post.title,
    authorName,
    authorAvatar,
    authorId: post.authorId
  });

  return (
    <Card className="overflow-hidden bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group">
      {thumbnailUrl && (
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <img 
              src={thumbnailUrl} 
              alt={post.title} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </AspectRatio>
          {type === 'trending' && (
            <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-700">
              Trending
            </Badge>
          )}
          {type === 'new' && (
            <Badge className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700">
              New
            </Badge>
          )}
          {isPremiumPost && (
            <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-amber-600">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authorAvatar || undefined} alt={authorName} />
            <AvatarFallback className="bg-purple-600 text-white text-xs">
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm text-white truncate">{authorName}</p>
              {isPremiumPost ? (
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-amber-100 text-purple-700 border-purple-200 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">{post.date}</p>
          </div>
        </div>
        
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
          {post.title}
        </h3>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-300 line-clamp-2 mb-3">
          {post.content}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>234</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>12</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>5</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
