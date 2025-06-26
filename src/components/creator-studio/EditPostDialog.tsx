
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Globe, Lock, Video } from "lucide-react";
import { TierSelect } from "@/components/dashboard/TierSelect";
import { FileAttachment, AttachmentFile } from "./FileAttachment";

interface EditPostDialogProps {
  post: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function EditPostDialog({ post, isOpen, onClose, onSave }: EditPostDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedTierIds, setSelectedTierIds] = useState<string[] | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing tier assignments for this post
  const { data: existingTiers } = useQuery({
    queryKey: ['post-tiers', post?.id],
    queryFn: async () => {
      if (!post?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from('post_tiers')
          .select('tier_id')
          .eq('post_id', post.id as any);
          
        if (error) {
          console.error('Error fetching post tiers:', error);
          return [];
        }
        
        return data?.map(pt => (pt as any).tier_id) || [];
      } catch (error) {
        console.error('Error in post tiers query:', error);
        return [];
      }
    },
    enabled: !!post?.id && isOpen,
  });

  // Fetch user's creator profile to get creator_id for NSFW checking
  const { data: creatorProfile } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('id, is_nsfw')
          .eq('user_id', user.id as any)
          .single();
          
        if (error) {
          console.error('Error fetching creator profile:', error);
          return null;
        }
        
        return data ? {
          id: (data as any).id,
          is_nsfw: (data as any).is_nsfw
        } : null;
      } catch (error) {
        console.error('Error in creator profile query:', error);
        return null;
      }
    },
    enabled: !!user?.id && isOpen
  });

  // Initialize form with post data
  useEffect(() => {
    if (post && isOpen) {
      setTitle(post.title || "");
      setContent(post.content || "");
      
      // Extract video URL from attachments
      const videoAttachment = post.attachments?.find((att: any) => att.type === "video");
      setVideoUrl(videoAttachment?.url || "");
      
      // Set non-video attachments
      const fileAttachments = post.attachments?.filter((att: any) => att.type !== "video") || [];
      setAttachments(fileAttachments.map((att: any) => ({
        url: att.url,
        name: att.name,
        type: att.type,
        size: att.size || 0
      })));
    }
  }, [post, isOpen]);

  // Set tier selection when existing tiers are loaded
  useEffect(() => {
    if (existingTiers && existingTiers.length > 0) {
      setSelectedTierIds(existingTiers);
    } else if (post?.tier_id) {
      setSelectedTierIds([post.tier_id]);
    } else {
      setSelectedTierIds(null);
    }
  }, [existingTiers, post?.tier_id]);

  const uploadFile = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('post-attachments')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
      return null;
    }
  };

  const isValidVideoUrl = (url: string): boolean => {
    if (!url) return true; // Empty URL is valid
    const videoUrlPatterns = [
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/,
      /^https?:\/\/(www\.)?vimeo\.com/,
      /^https?:\/\/(www\.)?dailymotion\.com/,
      /^https?:\/\/(www\.)?twitch\.tv/
    ];
    return videoUrlPatterns.some(pattern => pattern.test(url));
  };

  const handleTierSelect = (tierIds: string[] | null) => {
    setSelectedTierIds(tierIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    
    setIsLoading(true);
    try {
      // Upload new attachments
      const uploadedAttachments = [];
      for (const attachment of attachments) {
        if (attachment.file) {
          const url = await uploadFile(attachment.file, user?.id || '');
          if (url) {
            uploadedAttachments.push({
              url,
              name: attachment.file.name,
              type: attachment.type,
              size: attachment.file.size
            });
          }
        } else {
          // Keep existing attachment
          uploadedAttachments.push(attachment);
        }
      }

      // Add video URL to attachments if provided
      if (videoUrl) {
        uploadedAttachments.push({
          url: videoUrl,
          name: "Video",
          type: "video",
          size: 0
        });
      }

      // Update the post
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          title,
          content,
          attachments: uploadedAttachments,
          tier_id: selectedTierIds && selectedTierIds.length === 1 ? selectedTierIds[0] : null,
        } as any)
        .eq('id', post.id as any);

      if (updateError) throw updateError;

      // Handle tier assignments (delete existing and create new ones)
      if (selectedTierIds) {
        // Delete existing tier assignments
        await supabase
          .from('post_tiers')
          .delete()
          .eq('post_id', post.id as any);

        // Create new tier assignments
        if (selectedTierIds.length > 0) {
          const tierInserts = selectedTierIds.map(tierId => ({
            post_id: post.id,
            tier_id: tierId
          }));

          const { error: tierError } = await supabase
            .from('post_tiers')
            .insert(tierInserts as any);

          if (tierError) {
            console.error('Error updating post tiers:', tierError);
          }
        }
      }

      toast({
        title: "Post updated",
        description: "Your post has been updated successfully.",
      });

      onSave?.();
      onClose();
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update your post content and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              required
              disabled={isLoading}
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video URL (Optional)
            </Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube, Vimeo, or other video URL..."
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Supported platforms: YouTube, Vimeo, Dailymotion, Twitch
            </p>
          </div>
          
          <FileAttachment
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            disabled={isLoading}
          />
          
          <div className="space-y-2">
            <Label>Post Visibility</Label>
            <TierSelect
              onSelect={handleTierSelect}
              value={selectedTierIds}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {selectedTierIds && selectedTierIds.length > 0 ? (
                    <Lock className="mr-2 h-4 w-4" />
                  ) : (
                    <Globe className="mr-2 h-4 w-4" />
                  )}
                  Update Post
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
