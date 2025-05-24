
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

  // Enhanced attachment parsing to handle different data formats
  const parseAttachments = (attachments: any) => {
    if (!attachments) {
      return [];
    }
    
    // Handle the specific case where attachments have _type and value properties
    if (attachments && typeof attachments === 'object' && attachments._type !== undefined) {
      // If the value is "undefined" string or actual undefined, return empty array
      if (attachments.value === "undefined" || attachments.value === undefined || attachments.value === null) {
        return [];
      }
      // Try to parse the value if it's a string
      if (typeof attachments.value === 'string' && attachments.value !== "undefined") {
        try {
          const parsed = JSON.parse(attachments.value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return [];
        }
      }
      // If value is already an array, return it
      if (Array.isArray(attachments.value)) {
        return attachments.value;
      }
    }
    
    // If it's already an array, return it
    if (Array.isArray(attachments)) {
      return attachments;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof attachments === 'string' && attachments !== "undefined") {
      try {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    
    // If it's an object (but not the _type structure), wrap it in an array
    if (typeof attachments === 'object') {
      return [attachments];
    }
    
    return [];
  };

  const parsedAttachments = parseAttachments(post.attachments);
  
  // Only show attachments if we have valid attachment data
  const hasValidAttachments = parsedAttachments.length > 0 && 
    parsedAttachments.some(att => att && att.url && att.name);

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

        {/* Display attachments only if we have valid attachment data */}
        {hasValidAttachments && (
          <div className="my-6">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Attachments ({parsedAttachments.length})
            </h4>
            <PostAttachments attachments={parsedAttachments} />
          </div>
        )}

        <DialogFooter>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {post.tier_id ? 'Premium content' : 'Free content'}
              {hasValidAttachments && (
                <span className="ml-2">• {parsedAttachments.length} attachment{parsedAttachments.length !== 1 ? 's' : ''}</span>
              )}
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
