
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CreatorSettings } from "@/types/creator-studio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

export default function CreatorStudioSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<CreatorSettings>({
    id: user?.id || '',
    username: 'creator_username',
    fullName: 'Creator Name',
    email: user?.email || '',
    bio: 'I create awesome content about technology, design, and more...',
    website: 'https://example.com',
    avatar_url: 'https://i.pravatar.cc/150?u=creator',
    banner_url: null,
    created_at: new Date().toISOString(), // Adding the missing property
    user_id: user?.id || '' // Adding the missing property
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Updated",
        description: "Your creator profile has been successfully updated."
      });
    }, 1000);
  };

  const handleImageUpload = (type: 'avatar' | 'banner') => {
    toast({
      title: "Coming Soon",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} upload functionality is under development.`
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Creator Settings</h1>
      
      <form onSubmit={handleSave}>
        <div className="space-y-6">
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
                    onClick={() => handleImageUpload('avatar')}
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
          
          <Card>
            <CardHeader>
              <CardTitle>Profile Banner</CardTitle>
              <CardDescription>Upload a banner image for your creator page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                  {settings.banner_url ? (
                    <img 
                      src={settings.banner_url} 
                      alt="Profile banner" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <p className="text-muted-foreground">No banner image uploaded</p>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleImageUpload('banner')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Banner Image
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
