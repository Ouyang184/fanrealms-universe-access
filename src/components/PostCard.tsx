
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeDate } from '@/utils/auth-helpers';
import { PostAttachments } from './PostAttachments';

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorAvatar?: string | null;
  createdAt: string;
  date: string;
  tier_id?: string | null;
  attachments?: any; // JSON from database
}

const PostCard: React.FC<PostCardProps> = ({
  title,
  content,
  authorName,
  authorAvatar,
  createdAt,
  tier_id,
  attachments
}) => {
  // Parse attachments from JSON
  const parsedAttachments = attachments ? (Array.isArray(attachments) ? attachments : []) : [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatar || undefined} alt={authorName} />
            <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{authorName}</p>
              <div className="flex items-center gap-2">
                {tier_id && (
                  <Badge variant="secondary" className="text-xs">
                    Premium
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{content}</p>
          
          {/* Display attachments */}
          <PostAttachments attachments={parsedAttachments} />
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
