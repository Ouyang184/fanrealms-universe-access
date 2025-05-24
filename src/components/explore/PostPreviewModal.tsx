
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PostAttachments } from "@/components/PostAttachments";
import { formatRelativeDate } from "@/utils/auth-helpers";
import { Post } from "@/types";

interface PostPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
}

export function PostPreviewModal({ open, onOpenChange, post }: PostPreviewModalProps) {
  if (!post) return null;

  // Parse attachments from JSON
  const parsedAttachments = post.attachments ? (Array.isArray(post.attachments) ? post.attachments : []) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorAvatar || undefined} alt={post.authorName} />
              <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{post.authorName}</span>
                {post.tier_id && (
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatRelativeDate(post.createdAt)}
              </p>
            </div>
          </div>
          <DialogTitle className="text-left text-xl">{post.title}</DialogTitle>
          <DialogDescription className="text-left">
            {post.content}
          </DialogDescription>
        </DialogHeader>

        {/* Display attachments with proper scaling */}
        <div className="my-6">
          <PostAttachments attachments={parsedAttachments} />
        </div>

        <DialogFooter>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {post.tier_id ? 'Premium content' : 'Free content'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Visit Creator Page
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
