
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
import { ChevronRight, ArrowLeft, Upload, X } from 'lucide-react';
import { useCreatorImageUpload } from '@/hooks/useCreatorImageUpload';

const CompleteProfile = () => {
  const { user, loading } = useAuth();
  const [step, setStep] = useState<'profile' | 'content'>('profile');
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [selectedBannerImage, setSelectedBannerImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { uploadProfileImage, uploadBannerImage, isUploading } = useCreatorImageUpload();

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

  const handleProfileImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedProfileImage(file);
      const objectUrl = URL.createObjectURL(file);
      setProfileImagePreview(objectUrl);
    }
  };

  const handleBannerImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedBannerImage(file);
      const objectUrl = URL.createObjectURL(file);
      setBannerImagePreview(objectUrl);
    }
  };

  const clearProfileImage = () => {
    setSelectedProfileImage(null);
    setProfileImagePreview(null);
  };

  const clearBannerImage = () => {
    setSelectedBannerImage(null);
    setBannerImagePreview(null);
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
      
      // Upload images first if selected
      let profileImageUrl = null;
      let bannerImageUrl = null;
      
      if (selectedProfileImage) {
        profileImageUrl = await uploadProfileImage(selectedProfileImage);
      }
      
      if (selectedBannerImage) {
        bannerImageUrl = await uploadBannerImage(selectedBannerImage);
      }
      
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
          profile_image_url: profileImageUrl,
          banner_url: bannerImageUrl,
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
                <Label>Profile Picture</Label>
                <div className="space-y-4">
                  {profileImagePreview && (
                    <div className="relative w-24 h-24">
                      <img 
                        src={profileImagePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover rounded-full"
                      />
                      <button
                        onClick={clearProfileImage}
                        className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full hover:bg-destructive/90"
                        type="button"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('profile-image-upload')?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {profileImagePreview ? "Change Picture" : "Upload Picture"}
                    </Button>
                    <span className="text-sm text-muted-foreground">PNG or JPG</span>
                  </div>
                  <input
                    type="file"
                    id="profile-image-upload"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={handleProfileImageSelect}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profile Banner</Label>
                <div className="space-y-4">
                  <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                    {bannerImagePreview ? (
                      <>
                        <img 
                          src={bannerImagePreview} 
                          alt="Banner preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={clearBannerImage}
                          className="absolute top-2 right-2 p-1 bg-destructive rounded-full hover:bg-destructive/90"
                          type="button"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No banner image uploaded
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('banner-image-upload')?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {bannerImagePreview ? "Change Banner" : "Upload Banner"}
                    </Button>
                    <span className="text-sm text-muted-foreground">PNG or JPG</span>
                  </div>
                  <input
                    type="file"
                    id="banner-image-upload"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={handleBannerImageSelect}
                  />
                </div>
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
                  disabled={isSubmitting || selectedCategories.length === 0 || isUploading}
                >
                  {(isSubmitting || isUploading) ? <LoadingSpinner className="mr-2" /> : null}
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
