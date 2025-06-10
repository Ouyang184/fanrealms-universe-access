import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Globe, Lock, Video, Clock } from "lucide-react";
import { TierSelect } from "@/components/dashboard/TierSelect";
import { FileAttachment, AttachmentFile } from "./FileAttachment";
import { SchedulePostModal } from "./SchedulePostModal";

export function CreatePostForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleTierSelect = (tierId: string | null) => {
    console.log('[Creator Studio] Tier selected:', tierId);
    setSelectedTierId(tierId);
  };

  const handleSchedulePost = (date: Date) => {
    setScheduledDate(date);
    toast({
      title: "Post scheduled",
      description: `Your post will be published on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent, isScheduled = false) => {
    e.preventDefault();
    if (!user) return;
    
    console.log('[Creator Studio] Form submission started with selectedTierId:', selectedTierId);
    console.log('[Creator Studio] selectedTierId type:', typeof selectedTierId, 'value:', selectedTierId);
    
    // Validate video URL if provided
    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      toast({
        title: "Invalid video URL",
        description: "Please enter a valid YouTube, Vimeo, Dailymotion, or Twitch URL.",
        variant: "destructive",
      });
      return;
    }

    if (isScheduled && !scheduledDate) {
      setIsScheduleModalOpen(true);
      return;
    }
    
    setIsLoading(true);
    try {
      // Upload attachments
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

      // Add video URL to attachments if provided
      if (videoUrl) {
        uploadedAttachments.push({
          url: videoUrl,
          name: "Video",
          type: "video",
          size: 0
        });
      }

      const postData = {
        title: isScheduled && scheduledDate ? `SCHEDULED: ${title}` : title,
        content,
        author_id: user.id,
        creator_id: creatorProfile?.id || null,
        tier_id: selectedTierId, // This should properly set the tier_id
        attachments: uploadedAttachments,
        scheduled_for: isScheduled && scheduledDate ? scheduledDate.toISOString() : null
      };

      console.log('[Creator Studio] Creating post with data:', postData);

      const { data: insertedPost, error } = await supabase
        .from('posts')
        .insert([postData])
        .select('*');

      if (error) throw error;

      console.log('[Creator Studio] Post created successfully:', insertedPost);

      const postType = selectedTierId ? "premium" : "public";
      const actionType = isScheduled ? "scheduled" : "published";
      toast({
        title: `Post ${actionType}`,
        description: `Your ${postType} post has been ${actionType} successfully.`,
      });

      // Reset form and close dialog
      setTitle("");
      setContent("");
      setVideoUrl("");
      setSelectedTierId(null);
      setAttachments([]);
      setScheduledDate(null);
      setIsOpen(false);
      
      // Refresh creator posts list with the correct query key
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
      // Also invalidate other related queries
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

    } catch (error: any) {
      console.error('[Creator Studio] Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>Create Post</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your thoughts, ideas, or content with your followers. Choose who can see your post.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
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
                value={selectedTierId}
                disabled={isLoading}
              />
              {selectedTierId && (
                <div className="text-sm text-muted-foreground bg-amber-50 p-2 rounded border">
                  <Lock className="inline h-3 w-3 mr-1" />
                  This post will only be visible to subscribers of the selected membership tier.
                  <div className="mt-1 text-xs">Selected tier ID: {selectedTierId}</div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsScheduleModalOpen(true)}
                disabled={isLoading}
              >
                <Clock className="mr-2 h-4 w-4" />
                Schedule Post
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    {selectedTierId ? (
                      <Lock className="mr-2 h-4 w-4" />
                    ) : (
                      <Globe className="mr-2 h-4 w-4" />
                    )}
                    Publish {selectedTierId ? "Premium" : "Public"} Post
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SchedulePostModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={(date) => {
          handleSchedulePost(date);
          handleSubmit({ preventDefault: () => {} } as React.FormEvent, true);
        }}
      />
    </>
  );
}
