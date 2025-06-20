
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronRight, Clock, Eye, Heart, MessageSquare, Share2, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Post } from "@/types";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";
import { usePostViews } from "@/hooks/usePostViews";

interface ContentPerformanceCardProps {
  posts: Post[];
}

function PostPerformanceItem({ post }: { post: Post }) {
  const { likeCount } = useLikes(post.id);
  const { comments } = useComments(post.id);
  const { viewCount } = usePostViews(post.id);
  
  const getPostThumbnail = (post: Post) => {
    if (post.attachments && Array.isArray(post.attachments)) {
      const imageAttachment = post.attachments.find(
        (attachment: any) => attachment.type === 'image'
      );
      if (imageAttachment) {
        return imageAttachment.url;
      }
    }
    return `/placeholder.svg?seed=${post.id}`;
  };

  return (
    <div className="flex gap-4 p-3 rounded-lg border bg-muted/20">
      <div className="relative w-24 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
        <img
          src={getPostThumbnail(post)}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 right-1 bg-background/70 px-1.5 py-0.5 rounded text-xs">
          Post
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium line-clamp-1">{post.title}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {post.tier_id && (
                <Badge className="bg-primary text-xs mr-2">Premium</Badge>
              )}
              <Clock className="h-3 w-3 mr-1" />
              {post.date}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Post</DropdownMenuItem>
              <DropdownMenuItem>Edit Post</DropdownMenuItem>
              <DropdownMenuItem>View Analytics</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete Post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1 text-xs">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span>{viewCount}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Heart className="h-3 w-3 text-red-500" />
            <span>{likeCount}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <MessageSquare className="h-3 w-3 text-green-500" />
            <span>{comments.length}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Share2 className="h-3 w-3 text-blue-500" />
            <span>Share</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentPerformanceCard({ posts }: ContentPerformanceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Recent Content Performance</CardTitle>
          <Button variant="link" asChild className="text-primary p-0">
            <Link to="/creator-studio/posts">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <CardDescription>How your recent content is performing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostPerformanceItem key={post.id} post={post} />
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any posts yet.</p>
              <Button asChild>
                <Link to="/creator-studio/posts">Create Your First Post</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button asChild className="w-full">
          <Link to="/creator-studio/posts">Create New Content</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
