
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tags/TagInput";

interface PostFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  disabled: boolean;
}

export function PostFormFields({ 
  title, 
  setTitle, 
  content, 
  setContent, 
  tags,
  setTags,
  disabled 
}: PostFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter post title"
          required
          disabled={disabled}
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
          disabled={disabled}
          className="min-h-[150px]"
        />
      </div>

      <TagInput
        tags={tags}
        onTagsChange={setTags}
        maxTags={10}
        disabled={disabled}
        label="Tags"
        placeholder="Add tags to help people discover your content..."
      />
    </>
  );
}
