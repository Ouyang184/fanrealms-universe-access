
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreatorSettings } from "@/types/creator-studio";

const AVAILABLE_TAGS = [
  "Art", "Music", "Gaming", "Education", "Writing", 
  "Photography", "Fitness", "Cooking", "Technology", "Travel",
  "Fashion", "Design", "Podcasting", "Comedy", "Film",
  "Dance", "Science", "Finance", "Business", "Crafts"
];

interface ProfileInfoFormProps {
  settings: CreatorSettings;
  onSettingsChange: (name: string, value: string | string[]) => void;
  onImageUpload: (type: 'avatar') => void;
  isUploading?: boolean;
}

export function ProfileInfoForm({ settings, onSettingsChange, onImageUpload, isUploading = false }: ProfileInfoFormProps) {
  const [tagsOpen, setTagsOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onSettingsChange(name, value);
  };

  const handleTagSelect = (tag: string) => {
    // Check if tag already exists in the array
    if (settings.tags?.includes(tag)) {
      // Remove the tag
      const updatedTags = settings.tags.filter(t => t !== tag);
      onSettingsChange('tags', updatedTags);
    } else {
      // Add the tag
      const currentTags = settings.tags || [];
      onSettingsChange('tags', [...currentTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    const updatedTags = (settings.tags || []).filter(t => t !== tag);
    onSettingsChange('tags', updatedTags);
  };

  // Use display_name from formData - this ensures we show the current form value
  const displayName = settings.display_name || settings.username || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your public creator profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24">
              <AvatarImage src={settings.avatar_url || undefined} alt={displayName} />
              <AvatarFallback>{displayName?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => onImageUpload('avatar')}
              disabled={isUploading}
            >
              <Upload className={`${isUploading ? 'animate-spin' : ''} mr-2 h-4 w-4`} />
              {isUploading ? "Uploading..." : "Change Avatar"}
            </Button>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={settings.display_name || ''}
                onChange={handleChange}
                placeholder="How you want to be known publicly"
              />
              <p className="text-xs text-muted-foreground">
                This is how you'll appear to your audience
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={settings.email || ''}
                onChange={handleChange}
                readOnly
              />
            </div>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            value={settings.bio || ''}
            onChange={handleChange}
            placeholder="Tell your audience about yourself..."
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tags">Content Tags</Label>
          <div className="space-y-2">
            <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal"
                >
                  {settings.tags?.length 
                    ? `${settings.tags.length} tag${settings.tags.length > 1 ? 's' : ''} selected` 
                    : "Select content tags..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search for tags..." />
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {AVAILABLE_TAGS.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => {
                          handleTagSelect(tag);
                        }}
                      >
                        <span className={settings.tags?.includes(tag) ? "font-medium text-primary" : ""}>
                          {tag}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Display selected tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {settings.tags?.map((tag) => (
                <Badge key={tag} className="px-2 py-1 flex items-center gap-1">
                  {tag}
                  <button 
                    type="button" 
                    className="ml-1 focus:outline-none" 
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select tags that describe your content. This helps users discover your profile.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
