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
import { TagInput } from "@/components/tags/TagInput";
import { Switch } from "@/components/ui/switch";
import { Loader, Globe, Lock, Video, AlertTriangle, Calendar } from "lucide-react";
import { TierSelect } from "@/components/dashboard/TierSelect";
import { FileAttachment, AttachmentFile } from "./FileAttachment";
import { SchedulePostCalendar } from "./SchedulePostCalendar";

export function CreatePostForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTierIds, setSelectedTierIds] = useState<string[] | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isScheduleCalendarOpen, setIsScheduleCalendarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's creator profile to get creator_id and NSFW status
  const { data: creatorProfile } = useQuery({
    queryKey: ['userCreator', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('creators')
        .select('id, is_nsfw')
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

      // Store only the storage path; render with signed URLs at view time
      return fileName;
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
    console.log('[Creator Studio] Tiers selected:', tierIds);
    setSelectedTierIds(tierIds);
  };

  const handleSchedulePost = async (date: Date) => {
    console.log('[Creator Studio] Scheduling post for:', date);
    
    // Close the schedule calendar
    setIsScheduleCalendarOpen(false);
    
    // Submit the post with scheduled date
    const success = await handleSubmit(null, date);
    
    // Close the main create post dialog if successful
    if (success) {
      setIsOpen(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, scheduleDate?: Date): Promise<boolean> => {
    if (e) e.preventDefault();
    if (!user) return false;
    
    console.log('[Creator Studio] Form submission started with selectedTierIds:', selectedTierIds);
    console.log('[Creator Studio] User ID for author_id:', user.id);
    console.log('[Creator Studio] Creator NSFW setting:', creatorProfile?.is_nsfw);
    console.log('[Creator Studio] Scheduled date:', scheduleDate);
    
    // Validate video URL if provided
    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      toast({
        title: "Invalid video URL",
        description: "Please enter a valid YouTube, Vimeo, Dailymotion, or Twitch URL.",
        variant: "destructive",
      });
      return false;
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

      // Automatically set NSFW flag based on creator settings
      const isNSFW = creatorProfile?.is_nsfw || false;

      // Determine post status and scheduled time
      const isScheduled = !!scheduleDate;
      const postStatus = isScheduled ? 'scheduled' : 'published';
      const scheduledFor = isScheduled ? scheduleDate.toISOString() : null;

      const postData = {
        title,
        content,
        author_id: user.id,
        creator_id: creatorProfile?.id || null,
        tier_id: selectedTierIds && selectedTierIds.length === 1 ? selectedTierIds[0] : null,
        attachments: uploadedAttachments,
        is_nsfw: isNSFW,
        scheduled_for: scheduledFor,
        status: postStatus,
        tags: tags
      };

      console.log('[Creator Studio] Creating post with data:', postData);

      const { data: insertedPost, error } = await supabase
        .from('posts')
        .insert([postData])
        .select('*');

      if (error) throw error;

      // Handle multiple tier assignments
      if (selectedTierIds && selectedTierIds.length > 0 && insertedPost[0]) {
        const postTierInserts = selectedTierIds.map(tierId => ({
          post_id: insertedPost[0].id,
          tier_id: tierId
        }));

        const { error: tierError } = await supabase
          .from('post_tiers')
          .insert(postTierInserts);

        if (tierError) {
          console.error('Error assigning tiers to post:', tierError);
        }
      }

      console.log('[Creator Studio] Post created successfully');

      const postType = selectedTierIds && selectedTierIds.length > 0 ? "premium" : "public";
      const nsfwNotice = isNSFW ? " (automatically flagged as 18+)" : "";
      const scheduleNotice = scheduleDate ? " for " + scheduleDate.toLocaleDateString() + " at " + scheduleDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "";
      
      toast({
        title: scheduleDate ? "Post scheduled" : "Post created",
        description: `Your ${postType} post has been ${scheduleDate ? 'scheduled' : 'published'} successfully${nsfwNotice}${scheduleNotice}.`,
      });

      // Reset form
      setTitle("");
      setContent("");
      setVideoUrl("");
      setTags([]);
      setSelectedTierIds(null);
      setAttachments([]);
      
      // If not scheduling, close the dialog
      if (!scheduleDate) {
        setIsOpen(false);
      }
      
      // Refresh creator posts list
      queryClient.invalidateQueries({ queryKey: ['creator-posts'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      return true;

    } catch (error: any) {
      console.error('[Creator Studio] Error creating post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if this post will be automatically flagged as NSFW
  const willBeNSFW = creatorProfile?.is_nsfw || false;

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

          {/* NSFW Auto-Flag Notice */}
          {willBeNSFW && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Automatic 18+ Content Flagging</p>
                  <p className="text-xs mt-1">
                    Since you have 18+ content creation enabled in your settings, this post will automatically be flagged as mature content.
                  </p>
                </div>
              </div>
            </div>
          )}

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

            <TagInput
              tags={tags}
              onTagsChange={setTags}
              maxTags={10}
              disabled={isLoading}
              label="Tags"
              placeholder="Add tags to help people discover your content..."
            />
            
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
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsScheduleCalendarOpen(true)}
                disabled={isLoading}
              >
                <Calendar className="mr-2 h-4 w-4" />
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
                    {selectedTierIds && selectedTierIds.length > 0 ? (
                      <Lock className="mr-2 h-4 w-4" />
                    ) : (
                      <Globe className="mr-2 h-4 w-4" />
                    )}
                    Publish {selectedTierIds && selectedTierIds.length > 0 ? "Premium" : "Public"} Post
                    {willBeNSFW && " (18+)"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SchedulePostCalendar
        isOpen={isScheduleCalendarOpen}
        onOpenChange={setIsScheduleCalendarOpen}
        onSchedulePost={handleSchedulePost}
        postTitle={title}
        postContent={content}
      />
    </>
  );
}
