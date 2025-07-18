
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreatorSettingsData } from "@/types/creator-settings";

const AVAILABLE_TAGS = [
  "Gaming", "Art", "Music", "Writing", "Photography", "Education",
  "Fitness", "Cooking", "Technology", "Travel", "Fashion", "Design", 
  "Podcasting", "Comedy", "Film", "Dance", "Science", "Finance", 
  "Business", "Crafts", "Beauty", "Health", "Lifestyle", "Sports",
  "News", "Politics", "History", "Nature", "Automotive", "Real Estate"
];

interface ProfileInfoFormProps {
  settings: CreatorSettingsData | null;
  onSettingsChange: (name: string, value: string | string[] | boolean) => void;
  onImageUpload: (type: 'avatar') => void;
  isUploading?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
}

export function ProfileInfoForm({ 
  settings, 
  onSettingsChange, 
  onImageUpload, 
  isUploading = false,
  onSave,
  isSaving = false,
  hasChanges = false
}: ProfileInfoFormProps) {
  const [selectedTag, setSelectedTag] = useState<string>("");

  // Return loading state if settings is null
  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Loading profile information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onSettingsChange(name, value);
  };

  const handleTagAdd = (tag: string) => {
    if (!tag || settings.tags?.includes(tag)) return;
    
    const currentTags = settings.tags || [];
    onSettingsChange('tags', [...currentTags, tag]);
    setSelectedTag(""); // Reset selection
  };

  const removeTag = (tag: string) => {
    const updatedTags = (settings.tags || []).filter(t => t !== tag);
    onSettingsChange('tags', updatedTags);
  };

  // Prioritize display_name, then fall back to username
  const displayName = settings.display_name || settings.username || 'Creator';
  // Use avatar_url first, then profile_image_url as fallback
  const avatarUrl = settings.avatar_url || settings.profile_image_url || null;

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
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="text-xl">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
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
                This is how you'll appear to your audience (currently: {displayName})
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
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed from creator settings
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={6}
            value={settings.bio || ''}
            onChange={handleChange}
            placeholder="Tell your audience about yourself...&#10;&#10;You can embed images: ![Alt text](image-url)&#10;You can embed videos: @[Title](video-url)&#10;&#10;Example:&#10;I'm a digital artist who loves creating fantasy worlds!&#10;&#10;![My latest artwork](https://example.com/image.jpg)&#10;&#10;@[My creative process](https://youtube.com/watch?v=example)"
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Rich content supported:</strong></p>
            <p>• Images: <code>![Alt text](image-url)</code></p>
            <p>• Videos: <code>@[Title](video-url)</code></p>
            <p>• Supports YouTube, Vimeo, and direct video files</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tags">Content Tags</Label>
          <div className="space-y-3">
            <Select value={selectedTag} onValueChange={handleTagAdd}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a content tag to add..." />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg max-h-64 overflow-y-auto z-50">
                {AVAILABLE_TAGS.filter(tag => !settings.tags?.includes(tag)).map((tag) => (
                  <SelectItem key={tag} value={tag} className="cursor-pointer hover:bg-accent">
                    {tag}
                  </SelectItem>
                ))}
                {AVAILABLE_TAGS.filter(tag => !settings.tags?.includes(tag)).length === 0 && (
                  <SelectItem value="" disabled className="text-muted-foreground">
                    All available tags have been selected
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            
            {/* Display selected tags */}
            {settings.tags && settings.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {settings.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                    {tag}
                    <button 
                      type="button" 
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 focus:outline-none" 
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Select tags that describe your content. This helps users discover your profile. You have selected {settings.tags?.length || 0} tag{settings.tags?.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-start pt-4 border-t">
          <Button 
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className={`mr-2 h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
