import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tags/TagInput";
import { Plus } from "lucide-react";
import { useCreateDevlog } from "@/hooks/useProjects";

interface CreateDevlogDialogProps {
  projectId: string;
}

export function CreateDevlogDialog({ projectId }: CreateDevlogDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const createDevlog = useCreateDevlog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDevlog.mutateAsync({
      project_id: projectId,
      title,
      content,
      tags,
    });
    setTitle("");
    setContent("");
    setTags([]);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Devlog
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Post Devlog Update</DialogTitle>
          <DialogDescription>Share your development progress with your audience.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="devlog-title">Title</Label>
            <Input
              id="devlog-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Week 5: Added multiplayer support"
              required
              disabled={createDevlog.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="devlog-content">Content</Label>
            <Textarea
              id="devlog-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what you've been working on..."
              required
              disabled={createDevlog.isPending}
              className="min-h-[200px]"
            />
          </div>
          <TagInput
            tags={tags}
            onTagsChange={setTags}
            maxTags={5}
            disabled={createDevlog.isPending}
            label="Tags"
            placeholder="e.g. update, bugfix, feature"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createDevlog.isPending || !title.trim() || !content.trim()}>
              {createDevlog.isPending ? "Publishing..." : "Publish Devlog"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
