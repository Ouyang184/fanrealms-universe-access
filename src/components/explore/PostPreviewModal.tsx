
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
import { PostInteractions } from "@/components/post/PostInteractions";
import { PostComments } from "@/components/post/PostComments";

interface PostPreviewModalProps {
  post: any;
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function PostPreviewModal({ 
  post, 
  isOpen, 
  open, 
  onClose, 
  onOpenChange 
}: PostPreviewModalProps) {
  const { user } = useAuth();
  const { viewCount } = usePostViews(post?.id || '');

  const modalOpen = open !== undefined ? open : isOpen;
  const handleOpenChange = onOpenChange || ((open: boolean) => !open && onClose());

  if (!post) return null;

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
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
                  <span>{Number(viewCount) || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Post content */}
          <div className="prose prose-sm max-w-none">
            <p>{post.content}</p>
          </div>
          
          {/* Post attachments/media if any */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="space-y-2">
              {post.attachments.map((attachment: any, index: number) => (
                <div key={index}>
                  {attachment.type === 'image' && (
                    <img 
                      src={attachment.url} 
                      alt="Post attachment" 
                      className="rounded-lg max-w-full h-auto"
                    />
                  )}
                  {attachment.type === 'video' && (
                    <video 
                      controls 
                      className="rounded-lg max-w-full h-auto"
                      src={attachment.url}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Post interactions (like, comment, share) */}
          <PostInteractions 
            postId={post.id} 
            showCounts={true}
          />
          
          {/* Comments section */}
          <PostComments postId={post.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
