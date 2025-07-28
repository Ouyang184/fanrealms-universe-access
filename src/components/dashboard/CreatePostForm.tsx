
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { TierSelect } from "./TierSelect";
import { FileAttachment, AttachmentFile } from "@/components/creator-studio/FileAttachment";
import { useCreatePost } from "@/hooks/useCreatePost";
import { NSFWNotice } from "./NSFWNotice";
import { PostFormFields } from "./PostFormFields";
import { VideoUrlInput } from "./VideoUrlInput";
import { PostFormActions } from "./PostFormActions";
import { isValidVideoUrl } from "@/utils/postValidation";

export function CreatePostForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTierIds, setSelectedTierIds] = useState<string[] | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const { toast } = useToast();
  const { createPost, isLoading, creatorProfile } = useCreatePost();

  const handleTierSelect = (tierIds: string[] | null) => {
    console.log('Tiers selected in CreatePostForm:', tierIds);
    setSelectedTierIds(tierIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate video URL if provided
    if (videoUrl && !isValidVideoUrl(videoUrl)) {
      toast({
        title: "Invalid video URL",
        description: "Please enter a valid YouTube, Vimeo, Dailymotion, or Twitch URL.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await createPost({
      title,
      content,
      videoUrl,
      tags,
      selectedTierIds,
      attachments
    });

    if (success) {
      // Reset form and close dialog
      setTitle("");
      setContent("");
      setVideoUrl("");
      setTags([]);
      setSelectedTierIds(null);
      setAttachments([]);
      setIsOpen(false);
    }
  };

  // Determine if this post will be automatically flagged as NSFW
  const willBeNSFW = creatorProfile?.is_nsfw || false;

  return (
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

        <NSFWNotice willBeNSFW={willBeNSFW} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <PostFormFields
            title={title}
            setTitle={setTitle}
            content={content}
            setContent={setContent}
            tags={tags}
            setTags={setTags}
            disabled={isLoading}
          />

          <VideoUrlInput
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            disabled={isLoading}
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
          
          <PostFormActions
            isLoading={isLoading}
            selectedTierIds={selectedTierIds}
            willBeNSFW={willBeNSFW}
            onCancel={() => setIsOpen(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
