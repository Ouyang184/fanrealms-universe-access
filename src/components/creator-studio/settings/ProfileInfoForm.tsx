
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { CreatorSettings } from "@/types/creator-studio";

interface ProfileInfoFormProps {
  settings: CreatorSettings;
  onSettingsChange: (name: string, value: string) => void;
  onImageUpload: (type: 'avatar') => void;
}

export function ProfileInfoForm({ settings, onSettingsChange, onImageUpload }: ProfileInfoFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onSettingsChange(name, value);
  };

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
              <AvatarImage src={settings.avatar_url || undefined} alt={settings.fullName} />
              <AvatarFallback>{settings.fullName?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => onImageUpload('avatar')}
            >
              <Upload className="mr-2 h-4 w-4" />
              Change Avatar
            </Button>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Display Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={settings.fullName || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={settings.username || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={settings.email || ''}
                onChange={handleChange}
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
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            type="url"
            value={settings.website || ''}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
          />
        </div>
      </CardContent>
    </Card>
  );
}
