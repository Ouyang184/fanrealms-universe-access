
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, FileText, Heart, Eye, TrendingUp, Clock } from "lucide-react";
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

  // Helper functions to determine content type
  const determineContentType = (post: Post) => {
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
    // Check if there are image attachments
    if (post.attachments && Array.isArray(post.attachments)) {
      const imageAttachment = post.attachments.find(
        (attachment: any) => attachment.type === 'image'
      );
      if (imageAttachment) {
        return imageAttachment.url;
      }
    }
    return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(post.title || "Post")}`;
  };

  const contentType = determineContentType(post);

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 overflow-hidden">
        <div className="relative">
          <img
            src={getPostThumbnail(post)}
            alt={post.title}
            className="w-full h-40 object-cover"
          />
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
            {contentType === "article" && <FileText className="h-3 w-3" />}
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
