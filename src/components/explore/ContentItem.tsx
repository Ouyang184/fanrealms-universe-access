
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, FileText, Heart, Eye, TrendingUp, Clock, Play } from "lucide-react";
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

  // Helper function to get the first image from attachments
  const getFirstImage = (attachments: any) => {
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
      const imageAttachment = parsedAttachments.find(att => 
        att && att.type === 'image' && att.url
      );
      if (imageAttachment) {
        return imageAttachment;
      }
      
      // Check for video attachments to create thumbnail
      const videoAttachment = parsedAttachments.find(att => 
        att && att.type === 'video' && att.url
      );
      if (videoAttachment) {
        return { ...videoAttachment, isVideo: true };
      }
    }
    
    return null;
  };

  // Helper functions to determine content type
  const determineContentType = (post: Post) => {
    const firstMedia = getFirstImage(post.attachments);
    if (firstMedia) {
      return firstMedia.isVideo ? "video" : "image";
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
  
  // Generate a thumbnail for a post - use first image attachment or placeholder
  const getPostThumbnail = (post: Post) => {
    const firstMedia = getFirstImage(post.attachments);
    if (firstMedia && firstMedia.url) {
      return firstMedia.url;
    }
    return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(post.title || "Post")}`;
  };

  const contentType = determineContentType(post);
  const firstMedia = getFirstImage(post.attachments);

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="relative">
          <div className="relative w-full h-40">
            <img
              src={getPostThumbnail(post)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            {/* Video play overlay for video thumbnails */}
            {firstMedia && firstMedia.isVideo && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-black/70 rounded-full p-3">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute top-2 right-2">
            <Badge className={`flex items-center gap-1 ${type === 'trending' ? 'bg-orange-600' : 'bg-blue-600'}`}>
              {type === 'trending' ? <TrendingUp className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {type === 'trending' ? 'Trending' : 'New'}
            </Badge>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
            {Math.floor(Math.random() * 60) + 5}m
          </div>
          <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
            {contentType === "video" && <Video className="h-3 w-3" />}
            {contentType === "image" && <FileText className="h-3 w-3" />}
            {contentType === "article" && <FileText className="h-3 w-3" />}
            {contentType === "post" && <FileText className="h-3 w-3" />}
            {contentType}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.authorAvatar || `/placeholder.svg?text=${(post.authorName || "C").substring(0, 1)}`} alt={post.authorName || "Creator"} />
              <AvatarFallback className="text-xs">{(post.authorName || "C").substring(0, 1)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-400">{post.authorName || "Creator"}</span>
          </div>
          <h3 className="font-semibold line-clamp-2">{post.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {type === 'trending' ? (
              <>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {Math.floor(Math.random() * 10000) + 500}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {Math.floor(Math.random() * 1000) + 50}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeDate(post.createdAt)}
              </div>
            )}
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
