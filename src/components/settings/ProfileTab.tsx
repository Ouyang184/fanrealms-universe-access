
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useUnifiedAvatar } from "@/hooks/useUnifiedAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { Camera } from "lucide-react";

interface ProfileTabProps {
  user: User | null;
}

export function ProfileTab({ user }: ProfileTabProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { getAvatarUrl, uploadAvatar, isCreator } = useUnifiedAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileSettings, setProfileSettings] = useState({
    name: "",
    username: "",
    bio: "",
    website: "",
    saving: false,
    uploadingAvatar: false
  });

  useEffect(() => {
    const fetchUserWebsite = async () => {
      if (user && profile) {
        // Get website from users table
        const { data: userData } = await supabase
          .from('users')
          .select('website')
          .eq('id', user.id)
          .maybeSingle();
          
        setProfileSettings({
          name: user.user_metadata?.full_name || profile.username || "",
          username: profile.username || "",
          bio: profile.bio || "",
          website: userData?.website || "",
          saving: false,
          uploadingAvatar: false
        });
      }
    };
    
    fetchUserWebsite();
  }, [user, profile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setProfileSettings(prev => ({ ...prev, uploadingAvatar: true }));
    
    try {
      await uploadAvatar(file);
      // The upload function handles the toast notifications
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setProfileSettings(prev => ({ ...prev, uploadingAvatar: false }));
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      <CardContent className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={getAvatarUrl(profile) || ""} 
                alt="Profile picture" 
              />
              <AvatarFallback className="text-2xl bg-primary/10">
                {profile?.username?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="secondary"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
              onClick={handleAvatarClick}
              disabled={profileSettings.uploadingAvatar}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isCreator ? "Creator Avatar" : "Profile Picture"}
            </p>
            {isCreator && (
              <p className="text-xs text-muted-foreground mt-1">
                Creator avatar takes priority over user avatar
              </p>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

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
          disabled={profileSettings.saving || profileSettings.uploadingAvatar}
        >
          {profileSettings.saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
