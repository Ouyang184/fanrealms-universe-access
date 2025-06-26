import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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
import { Loader, Globe, Lock, Video, Save } from "lucide-react";
import { TierSelect } from "@/components/dashboard/TierSelect";
import { FileAttachment, AttachmentFile } from "./FileAttachment";
import { CreatorPost } from "@/types/creator-studio";

interface EditPostDialogProps {
  post: CreatorPost;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPostDialog({ post, isOpen, onOpenChange }: EditPostDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedTierIds, setSelectedTierIds] = useState<string[] | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing post tiers
  const { data: existingTiers } = useQuery({
    queryKey: ['post-tiers', post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_tiers')
        .select('tier_id')
        .eq('post_id', post.id);
        
      if (error) throw error;
      return data?.map(pt => pt.tier_id) || [];
    },
    enabled: !!post.id && isOpen
  });

  // Initialize selectedTierIds from existing data
  useEffect(() => {
    if (existingTiers) {
      setSelectedTierIds(existingTiers.length > 0 ? existingTiers : null);
    } else if (post.tier_id) {
      // Legacy single tier support
      setSelectedTierIds([post.tier_id]);
    } else {
      setSelectedTierIds(null);
    }
  }, [existingTiers, post.tier_id]);

  // Extract video URL from existing attachments
  useEffect(() => {
    if (post.attachments) {
      const videoAttachment = post.attachments.find(att => att.type === "video");
      if (videoAttachment) {
        setVideoUrl(videoAttachment.url);
      }
    }
  }, [post.attachments]);

  // Fetch user's creator profile to get creator_id
  const { data: creatorProfile } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching creator profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id
  });

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
    console.log('[Edit Post] Tiers selected:', tierIds);
    setSelectedTierIds(tierIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    console.log('[Edit Post] Form submission started with selectedTierIds:', selectedTierIds);
    
    // Validate video URL if provided
    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      toast({
        title: "Invalid video URL",
        description: "Please enter a valid YouTube, Vimeo, Dailymotion, or Twitch URL.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Upload new attachments
      const uploadedAttachments = [];
      for (const attachment of attachments) {
        const url = await uploadFile(attachment.file, user.id);
        if (url) {
          uploadedAttachments.push({
            url,
            name: attachment.file.name,
            type: attachment.type,
            size: attachment.file.size
          });
        }
      }

      // Keep existing attachments that aren't being replaced
      const existingAttachments = post.attachments?.filter(att => {
        // Remove existing video if new video URL is provided
        if (att.type === "video" && videoUrl) return false;
        return true;
      }) || [];

      // Add video URL to attachments if provided
      if (videoUrl) {
        uploadedAttachments.push({
          url: videoUrl,
          name: "Video",
          type: "video",
          size: 0
        });
      }

      // Combine existing and new attachments
      const finalAttachments = [...existingAttachments, ...uploadedAttachments];

      const updateData = {
        title,
        content,
        tier_id: selectedTierIds && selectedTierIds.length === 1 ? selectedTierIds[0] : null, // Legacy support
        attachments: finalAttachments,
        updated_at: new Date().toISOString()
      };

      console.log('[Edit Post] Updating post with data:', updateData);

      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id)
        .select('*');

      if (error) throw error;

      // Update post tiers - remove existing and add new ones
      await supabase
        .from('post_tiers')
        .delete()
        .eq('post_id', post.id);

      if (selectedTierIds && selectedTierIds.length > 0) {
        const postTierInserts = selectedTierIds.map(tierId => ({
          post_id: post.id,
          tier_id: tierId
        }));

        const { error: tierError } = await supabase
          .from('post_tiers')
          .insert(postTierInserts);

        if (tierError) {
          console.error('Error updating post tiers:', tierError);
        }
      }

      console.log('[Edit Post] Post updated successfully:', updatedPost);

      const postType = selectedTierIds && selectedTierIds.length > 0 ? "premium" : "public";
      toast({
        title: "Post updated",
        description: `Your ${postType} post has been updated successfully.`,
      });

      // Close dialog
      onOpenChange(false);
      
      // Refresh creator posts list
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });

    } catch (error: any) {
      console.error('[Edit Post] Error updating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update your post content, visibility, and attachments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              required
              disabled={isLoading}
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-videoUrl" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video URL (Optional)
            </Label>
            <Input
              id="edit-videoUrl"
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
              onClick={() => onOpenChange(false)}
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
                  <Save className="mr-2 h-4 w-4" />
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
