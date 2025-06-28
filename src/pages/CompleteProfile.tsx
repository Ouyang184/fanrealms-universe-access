
import React, { useState, useEffect } from 'react';
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
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isValidatingUser, setIsValidatingUser] = useState<boolean>(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user exists in public.users table (created by trigger)
  useEffect(() => {
    const checkUserExists = async () => {
      if (!user?.id || loading) return;
      
      console.log('Checking if user exists in public.users:', user.id);
      setIsValidatingUser(true);
      
      try {
        // Wait a bit for the trigger to complete if user just signed up
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, email, username')
            .eq('id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking user existence:', error);
            throw error;
          }
          
          if (userData) {
            console.log('User exists in public.users:', userData);
            setIsValidatingUser(false);
            return;
          }
          
          // User doesn't exist yet, wait and retry (trigger may still be processing)
          console.log(`User not found, attempt ${attempts + 1}/${maxAttempts}, waiting...`);
          attempts++;
          
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If we get here, the trigger failed to create the user
        throw new Error('User record was not created by the database trigger');
        
      } catch (error: any) {
        console.error('User validation failed:', error);
        
        toast({
          title: "Account Setup Error",
          description: "There was an issue setting up your account. Please try refreshing the page.",
          variant: "destructive"
        });
      } finally {
        setIsValidatingUser(false);
      }
    };

    checkUserExists();
  }, [user?.id, loading, toast]);

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

  const uploadImageToStorage = async (file: File, bucket: string, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      
      console.log(`Uploading to ${bucket}/${filePath}`);
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });
      
      if (uploadError) {
        console.error(`Storage upload error to ${bucket}:`, uploadError);
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      console.log(`Upload successful to ${bucket}, public URL:`, publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error(`Error uploading to ${bucket}:`, error);
      toast({
        title: "Image upload failed",
        description: `Failed to upload ${folder} image. Continuing without image.`,
        variant: "destructive"
      });
      return null;
    }
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
      setIsUploading(true);
      
      console.log('Starting creator profile creation for user:', user?.id);
      
      // Upload images if selected
      let profileImageUrl = null;
      let bannerImageUrl = null;
      
      if (selectedProfileImage) {
        console.log('Uploading profile image...');
        profileImageUrl = await uploadImageToStorage(selectedProfileImage, 'avatars', 'avatar');
      }
      
      if (selectedBannerImage) {
        console.log('Uploading banner image...');
        bannerImageUrl = await uploadImageToStorage(selectedBannerImage, 'banners', 'banner');
      }
      
      setIsUploading(false);
      
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
      
      console.log('Creating creator profile with data:', {
        user_id: user?.id,
        display_name: displayName.trim(),
        bio: bio.trim(),
        profile_image_url: profileImageUrl,
        banner_url: bannerImageUrl,
        tags: tags
      });
      
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
        console.error('Error creating creator profile:', error);
        throw error;
      }
      
      console.log('Creator profile created successfully:', data);
      
      toast({
        title: "Creator profile created",
        description: "Welcome to FanRealms! You're now a creator."
      });
      
      // Navigate to home page
      navigate('/home');
      
    } catch (error: any) {
      console.error("Error creating creator profile:", error);
      
      let errorMessage = "Failed to create your creator profile. Please try again.";
      
      // Provide more specific error messages
      if (error.message?.includes('duplicate key')) {
        errorMessage = "You already have a creator profile. Redirecting to home...";
        setTimeout(() => navigate('/home'), 2000);
      } else if (error.message?.includes('violates foreign key constraint')) {
        errorMessage = "Account setup incomplete. Please refresh the page and try again.";
      } else if (error.message?.includes('violates row-level security')) {
        errorMessage = "Security policy error. Please try logging out and back in.";
      } else if (error.message?.includes('not authenticated')) {
        errorMessage = "Please log in to create a creator profile.";
        navigate('/login');
        return;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Show loading while checking user exists or if auth is loading
  if (loading || isValidatingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-muted-foreground">
            {loading ? "Loading..." : "Setting up your account..."}
          </p>
        </div>
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
                <Label>Profile Picture (Optional)</Label>
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
                    <span className="text-sm text-muted-foreground">PNG or JPG (Optional)</span>
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
                <Label>Profile Banner (Optional)</Label>
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
                    <span className="text-sm text-muted-foreground">PNG or JPG (Optional)</span>
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
                  {isSubmitting ? "Creating Profile..." : isUploading ? "Uploading Images..." : "Become a Creator"}
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
