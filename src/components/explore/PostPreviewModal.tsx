
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
    console.log('Raw attachments received:', attachments);
    console.log('Attachments type:', typeof attachments);
    console.log('Attachments constructor:', attachments?.constructor?.name);
    
    if (!attachments) {
      console.log('No attachments found');
      return [];
    }
    
    // Handle the specific case where attachments have _type and value properties
    if (attachments && typeof attachments === 'object' && attachments._type !== undefined) {
      console.log('Found _type structure:', attachments);
      // If the value is "undefined" string or actual undefined, return empty array
      if (attachments.value === "undefined" || attachments.value === undefined || attachments.value === null) {
        console.log('Attachments value is undefined/null');
        return [];
      }
      // Try to parse the value if it's a string
      if (typeof attachments.value === 'string') {
        try {
          const parsed = JSON.parse(attachments.value);
          console.log('Parsed attachments from value string:', parsed);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.log('Failed to parse attachments value as JSON:', error);
          return [];
        }
      }
      // If value is already an array, return it
      if (Array.isArray(attachments.value)) {
        console.log('Attachments value is array:', attachments.value);
        return attachments.value;
      }
    }
    
    // If it's already an array, return it
    if (Array.isArray(attachments)) {
      console.log('Attachments is array:', attachments);
      return attachments;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof attachments === 'string') {
      try {
        const parsed = JSON.parse(attachments);
        console.log('Parsed attachments from string:', parsed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.log('Failed to parse attachments JSON:', error);
        return [];
      }
    }
    
    // If it's an object (but not the _type structure), wrap it in an array
    if (typeof attachments === 'object') {
      console.log('Wrapping object in array:', attachments);
      return [attachments];
    }
    
    console.log('No valid attachment format found, returning empty array');
    return [];
  };

  const parsedAttachments = parseAttachments(post.attachments);
  
  console.log('Post attachments raw:', post.attachments);
  console.log('Post attachments parsed:', parsedAttachments);
  console.log('Final parsed attachments count:', parsedAttachments.length);

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
        {parsedAttachments.length > 0 && (
          <div className="my-6">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Attachments ({parsedAttachments.length})
            </h4>
            <PostAttachments attachments={parsedAttachments} />
          </div>
        )}

        {/* Debug information for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="my-4 p-3 bg-gray-100 rounded text-xs">
            <strong>Debug Info:</strong>
            <pre className="mt-1 whitespace-pre-wrap">
              Raw: {JSON.stringify(post.attachments, null, 2)}
              Parsed: {JSON.stringify(parsedAttachments, null, 2)}
            </pre>
          </div>
        )}

        <DialogFooter>
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {post.tier_id ? 'Premium content' : 'Free content'}
              {parsedAttachments.length > 0 && (
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
