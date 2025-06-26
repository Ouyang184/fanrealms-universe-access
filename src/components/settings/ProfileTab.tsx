
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface ProfileTabProps {
  user: User | null;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const { toast } = useToast();
  const [profileSettings, setProfileSettings] = useState({
    name: "",
    username: "",
    bio: "",
    website: "",
    saving: false
  });

  useEffect(() => {
    if (user) {
      setProfileSettings({
        name: user.user_metadata?.full_name || "John Doe",
        username: user.user_metadata?.username || "johndoe",
        bio: "Digital creator and tech enthusiast",
        website: "https://example.com",
        saving: false
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileSettings(prev => ({ ...prev, [name]: value }));
  };

  const saveProfileSettings = async () => {
    setProfileSettings(prev => ({ ...prev, saving: true }));
    
    try {
      // Update auth metadata (for name)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileSettings.name,
          username: profileSettings.username
        }
      });

      if (authError) throw authError;

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: profileSettings.username,
          website: profileSettings.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProfileSettings(prev => ({ ...prev, saving: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your public profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={profileSettings.name}
              onChange={handleProfileChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              name="username" 
              value={profileSettings.username}
              onChange={handleProfileChange}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Input 
            id="bio" 
            name="bio" 
            value={profileSettings.bio}
            onChange={handleProfileChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input 
            id="website" 
            name="website" 
            type="url"
            value={profileSettings.website}
            onChange={handleProfileChange}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveProfileSettings} 
          disabled={profileSettings.saving}
        >
          {profileSettings.saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
