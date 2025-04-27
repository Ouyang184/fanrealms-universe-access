
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Post } from "@/types";

interface PostCardProps extends Post {
  isLoading?: boolean;
  description?: string;  // Make explicit for backwards compatibility
  image?: string;        // Make explicit for backwards compatibility
}

const PostCard: React.FC<PostCardProps> = ({ 
  id,
  title, 
  description, 
  image, 
  authorName, 
  authorAvatar, 
  date,
  content,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <div className="relative">
          <AspectRatio ratio={16/9} className="bg-muted">
            <Skeleton className="h-full w-full" />
          </AspectRatio>
        </div>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-6" />
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use description if provided, otherwise fall back to content
  const displayDescription = description || content;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link to={`/post/${id}`}>
        <div className="relative">
          <AspectRatio ratio={16/9}>
            <img 
              src={image || `https://picsum.photos/seed/${id}/800/450`} 
              alt={title}
              className="object-cover w-full h-full rounded-t-md"
            />
          </AspectRatio>
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/post/${id}`}>
          <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
          <p className="text-muted-foreground line-clamp-2 mt-1 text-sm">{displayDescription}</p>
        </Link>
        <div className="flex items-center space-x-3 mt-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <Link to={`/creator/${authorName.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm font-medium hover:underline">
              {authorName}
            </Link>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
