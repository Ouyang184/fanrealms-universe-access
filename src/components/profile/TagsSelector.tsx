
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const AVAILABLE_TAGS = [
  "Gaming", "Art", "Music", "Writing", "Photography", "Education",
  "Fitness", "Cooking", "Technology", "Travel", "Fashion", "Design", 
  "Podcasting", "Comedy", "Film", "Dance", "Science", "Finance", 
  "Business", "Crafts", "Beauty", "Health", "Lifestyle", "Sports",
  "News", "Politics", "History", "Nature", "Automotive", "Real Estate"
];

interface TagsSelectorProps {
  selectedTags: string[];
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
}

export const TagsSelector: React.FC<TagsSelectorProps> = ({
  selectedTags,
  onTagAdd,
  onTagRemove
}) => {
  const [selectedTag, setSelectedTag] = useState<string>("");

  const handleTagAdd = (tag: string) => {
    if (!tag) return;
    onTagAdd(tag);
    setSelectedTag("");
  };

  const availableOptions = AVAILABLE_TAGS.filter(tag => !selectedTags.includes(tag));

  return (
    <div className="grid gap-2">
      <FormLabel htmlFor="tags">Content Tags</FormLabel>
      <div className="space-y-3">
        <Select value={selectedTag} onValueChange={handleTagAdd}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a content tag to add..." />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg max-h-64 overflow-y-auto z-50">
            {availableOptions.map((tag) => (
              <SelectItem key={tag} value={tag} className="cursor-pointer hover:bg-accent">
                {tag}
              </SelectItem>
            ))}
            {availableOptions.length === 0 && (
              <SelectItem value="" disabled className="text-muted-foreground">
                All available tags have been selected
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        
        {selectedTags && selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                {tag}
                <button 
                  type="button" 
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 focus:outline-none" 
                  onClick={() => onTagRemove(tag)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground">
          Select tags that describe your content. This helps others discover your profile. You have selected {selectedTags?.length || 0} tag{selectedTags?.length !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  );
};
