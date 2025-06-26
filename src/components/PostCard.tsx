import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Heart, MessageSquare, Share2, Verified } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Post } from "@/types";
import { usePostLikes } from "@/hooks/usePostLikes";
import { usePostViews } from "@/hooks/usePostViews";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const [authorProfile, setAuthorProfile] = useState<{ username: string; profile_picture: string | null } | null>(null);
  const { likes, handleLike, isLiked } = usePostLikes(post.id);
  const { viewCount } = usePostViews(post.id);

  useEffect(() => {
    const fetchAuthorProfile = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('username, profile_picture')
        .eq('id', post.authorId as any)
        .single();

      if (error) {
        console.error("Error fetching author profile:", error);
      } else {
        setAuthorProfile({
          username: data.username,
          profile_picture: data.profile_picture,
        });
      }
    };

    fetchAuthorProfile();
  }, [post.authorId]);

  const renderMedia = () => {
    if (!post.attachments || post.attachments.length === 0) {
      return null;
    }

    const firstAttachment = post.attachments[0];

    if (firstAttachment.type === 'image') {
      return (
        <img
          src={firstAttachment.url}
          alt={post.title}
          className="aspect-video w-full object-cover rounded-md"
        />
      );
    } else if (firstAttachment.type === 'video') {
      return (
        <video controls className="aspect-video w-full object-cover rounded-md">
          <source src={firstAttachment.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }

    return null;
  };

  return (
    <Card className="w-full hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={authorProfile?.profile_picture || ""} />
            <AvatarFallback className="bg-primary/80 text-primary-foreground">
              {authorProfile?.username ? authorProfile.username.substring(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Link to={`/profile/${post.authorId}`} className="font-semibold hover:underline">
              {authorProfile?.username || "Unknown User"}
            </Link>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Unknown date'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold">{post.title}</h2>
        <p className="text-sm text-muted-foreground">{post.content}</p>
      </div>

      {renderMedia()}
      
      {/* Post stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{viewCount !== null ? Number(viewCount) : 0}</span>
          </div>
          <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 hover:text-primary">
            <Heart className={cn("h-4 w-4", isLiked ? "fill-primary text-primary" : "")} />
            <span>{likes}</span>
          </button>
          <Link to={`/posts/${post.id}`} className="flex items-center gap-1 hover:text-primary">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comment_count || 0}</span>
          </Link>
        </div>

        <div>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
