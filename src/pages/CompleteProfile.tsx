
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
import { CategoryGrid } from '@/components/onboarding/CategoryGrid';
import { ChevronRight, ArrowLeft } from 'lucide-react';

const CompleteProfile = () => {
  const { user, loading } = useAuth();
  const [step, setStep] = useState<'profile' | 'content'>('profile');
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if no authenticated user
  if (!user && !loading) {
    navigate('/login');
    return null;
  }

  const handleCategoryToggle = (id: number) => {
    setSelectedCategories((prev) => 
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const handleProfileNext = () => {
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name to continue.",
        variant: "destructive"
      });
      return;
    }
    setStep('content');
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "Content type required",
        description: "Please select at least one content type.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Map category IDs to tag names
      const categoryMap: { [key: number]: string } = {
        1: "art",
        2: "gaming", 
        3: "music",
        4: "writing",
        5: "photography",
        6: "education",
        7: "podcasts",
        8: "cooking",
        9: "fitness",
        10: "technology",
        11: "fashion",
        12: "film"
      };
      
      const tags = selectedCategories.map(id => categoryMap[id]).filter(Boolean);
      
      // Create creator profile
      const { data, error } = await supabase
        .from('creators')
        .insert([{
          user_id: user?.id,
          display_name: displayName.trim(),
          bio: bio.trim(),
          profile_image_url: profilePicture || null,
          tags: tags
        }])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Creator profile created",
        description: "Welcome to FanRealms! You're now a creator."
      });
      
      // Navigate to home page
      navigate('/home');
      
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>
            {step === 'profile' ? 'Complete Your Creator Profile' : 'What Type of Content Do You Create?'}
          </CardTitle>
          <CardDescription>
            {step === 'profile' 
              ? 'Set up your creator profile to start sharing content with your audience.'
              : 'Select the categories that best describe your content.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'profile' ? (
            <div className="space-y-6">
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

              <Button 
                onClick={handleProfileNext}
                className="w-full"
                disabled={!displayName.trim()}
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <CategoryGrid 
                selectedCategories={selectedCategories} 
                onToggle={handleCategoryToggle} 
              />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('profile')}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedCategories.length === 0}
                >
                  {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
                  {isSubmitting ? "Creating Profile..." : "Become a Creator"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
