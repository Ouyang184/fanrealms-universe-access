
import React from "react";
import { FeedPost } from "@/types/FeedPostTypes";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTierColor, getContentTypeIcon, isEventContent } from "@/utils/feedUtils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MoreHorizontal,
  Clock,
  Eye,
  ThumbsUp,
  Bell,
  Download,
} from "lucide-react";

interface FeedPostProps {
  post: FeedPost;
}

export const FeedPostComponent: React.FC<FeedPostProps> = ({ post }) => {
  return (
    <Card key={post.id} className="overflow-hidden">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.creator.avatar || "/placeholder.svg"} alt={post.creator.name} />
              <AvatarFallback>{post.creator.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{post.creator.name}</h3>
                <Badge className={`${getTierColor(post.creator.tier.color)}`}>{post.creator.tier.name}</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{post.metadata.posted}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {post.metadata.isNew && <Badge className="mr-2 bg-blue-600">New</Badge>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Save Post</DropdownMenuItem>
                <DropdownMenuItem>Hide Post</DropdownMenuItem>
                <DropdownMenuItem>Turn Off Notifications</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Report Content</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        <div>
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">{post.content.title}</h2>
            <p className="text-muted-foreground">{post.content.description}</p>
          </div>

          {/* Post Media */}
          <div className="relative">
            {post.content.thumbnail && (
              <img
                src={post.content.thumbnail || "/placeholder.svg"}
                alt={post.content.title}
                className="w-full object-cover max-h-[400px]"
              />
            )}
            {'images' in post.content && post.content.images && (
              <div className="grid grid-cols-2 gap-2 p-4">
                {post.content.images.map((image, index) => (
                  <img
                    key={index}
                    src={image || "/placeholder.svg"}
                    alt={`${post.content.title} - Image ${index + 1}`}
                    className="w-full h-40 object-cover rounded-md"
                  />
                ))}
              </div>
            )}
            {/* Content Type Badge */}
            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs flex items-center gap-1">
              {getContentTypeIcon(post.content.type)}
              {post.content.type.charAt(0).toUpperCase() + post.content.type.slice(1)}
              {'duration' in post.content && post.content.duration && ` • ${post.content.duration}`}
              {'fileSize' in post.content && post.content.fileSize && ` • ${post.content.fileSize}`}
              {'lessons' in post.content && post.content.lessons && ` • ${post.content.lessons} lessons`}
              {isEventContent(post.content) && post.content.date && ` • ${post.content.date}`}
            </div>
            {/* Preview Badge */}
            {!post.content.preview && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-purple-600">Subscribers Only</Badge>
              </div>
            )}
          </div>

          {/* Post Stats and Actions */}
          <div className="p-4 flex flex-wrap items-center justify-between border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                {post.metadata.views && (
                  <>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{post.metadata.views.toLocaleString()}</span>
                  </>
                )}
                {post.metadata.downloads && (
                  <>
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span>{post.metadata.downloads.toLocaleString()}</span>
                  </>
                )}
                {post.metadata.interested && (
                  <>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span>{post.metadata.interested.toLocaleString()}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                <span>{post.metadata.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>{post.metadata.comments.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Button variant="ghost" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                Like
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comment
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between">
        <Button variant="ghost" size="sm" className="text-primary">
          View All Comments
        </Button>
        <Button variant="default" size="sm">
          {post.content.preview ? "View Full Post" : "Subscribe to View"}
        </Button>
      </CardFooter>
    </Card>
  );
};
