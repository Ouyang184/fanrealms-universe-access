
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

const CompleteProfile = () => {
  const { user, profile, updateProfile, loading } = useAuth();
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if no authenticated user
  if (!user && !loading) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name to continue.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create creator profile
      const { data, error } = await supabase
        .from('creators')
        .insert([{
          user_id: user?.id,
          display_name: displayName.trim(),
          bio: bio.trim(),
          profile_image_url: profilePicture || null,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        }])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Creator profile created",
        description: "Your creator profile has been set up successfully!"
      });
      
      // Navigate to creator dashboard
      navigate('/creator-studio/dashboard');
      
    } catch (error: any) {
      console.error("Error creating creator profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create your creator profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Creator Profile</CardTitle>
          <CardDescription>
            Set up your creator profile to start sharing content with your audience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your creator name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself and your content"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture URL</Label>
              <Input
                id="profilePicture"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="Enter a URL for your profile picture"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Content Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="gaming, art, music (separate with commas)"
              />
              <p className="text-sm text-muted-foreground">
                Add tags that describe the type of content you create
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
              {isSubmitting ? "Creating Profile..." : "Create Creator Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
