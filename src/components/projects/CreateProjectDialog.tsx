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
import { useCreateProject } from "@/hooks/useProjects";

interface CreateProjectDialogProps {
  creatorId: string;
}

export function CreateProjectDialog({ creatorId }: CreateProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync({
      creator_id: creatorId,
      title,
      description,
      tags,
      website_url: websiteUrl || undefined,
      repository_url: repositoryUrl || undefined,
      status: 'published',
    });
    setTitle("");
    setDescription("");
    setTags([]);
    setWebsiteUrl("");
    setRepositoryUrl("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Showcase a game, tool, or tech project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Game"
              required
              disabled={createProject.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              disabled={createProject.isPending}
              className="min-h-[100px]"
            />
          </div>
          <TagInput
            tags={tags}
            onTagsChange={setTags}
            maxTags={8}
            disabled={createProject.isPending}
            label="Tags"
            placeholder="e.g. game, unity, pixel-art"
          />
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL (optional)</Label>
            <Input
              id="website-url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://mygame.com"
              disabled={createProject.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo-url">Repository URL (optional)</Label>
            <Input
              id="repo-url"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              disabled={createProject.isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending || !title.trim()}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
