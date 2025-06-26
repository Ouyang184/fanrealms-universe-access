import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePostViews } from "@/hooks/usePostViews";
import { useLikes } from "@/hooks/useLikes";
import { useComments } from "@/hooks/useComments";

interface PostPreviewModalProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
}

export function PostPreviewModal({ post, isOpen, onClose }: PostPreviewModalProps) {
  const { user } = useAuth();
  const { viewCount } = usePostViews(post?.id || '');
  const { likeCount, isLiked, toggleLike } = useLikes(post?.id || '');
  const { comments } = useComments(post?.id || '');

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold">{post.title}</DialogTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.authorAvatar || ''} />
                    <AvatarFallback>
                      {post.authorName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{post.authorName}</span>
                </div>
                <span>•</span>
                <span>{post.date}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{Number(viewCount)}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
