
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { useProfile } from '@/hooks/useProfile';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { X, Upload } from 'lucide-react';

// Form validation schema
const profileSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email().optional(),
  profile_picture: z.string().optional().nullable(),
  website: z.string().url({ message: "Must be a valid URL" }).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Be careful not to use Profile as the component name since it conflicts with the Profile type
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { fetchUserProfile, updateProfile, uploadProfileImage } = useProfile();
  const { toast } = useToast();

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      profile_picture: '',
      website: null,
    }
  });

  useEffect(() => {
    async function loadProfile() {
      if (user?.id) {
        setLoading(true);
        const profile = await fetchUserProfile(user.id);
        setProfileData(profile);
        
        // Reset form with profile data
        if (profile) {
          form.reset({
            username: profile.username || '',
            email: profile.email || '',
            profile_picture: profile.profile_picture || null,
            website: profile.website || null,
          });
        }
        
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [user, fetchUserProfile, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const fileType = file.type;
      if (!fileType.match(/image\/(jpeg|jpg|png)/)) {
        toast({
          title: "Invalid file",
          description: "Please select a PNG or JPG image.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const onSubmit = async (formData: ProfileFormValues) => {
    if (!user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Upload image if selected
      let imageUrl = formData.profile_picture;
      if (selectedFile) {
        imageUrl = await uploadProfileImage(user.id, selectedFile);
        if (!imageUrl) {
          setIsSubmitting(false);
          return; // Error already shown in toast
        }
      }
      
      // Prepare data for update
      const updateData = {
        username: formData.username,
        profile_picture: imageUrl,
        website: formData.website,
      };
      
      // Update profile
      const updatedProfile = await updateProfile(user.id, updateData);
      
      if (updatedProfile) {
        setProfileData(updatedProfile);
        setIsEditing(false);
        
        // Clear selected file
        clearSelectedImage();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Profile' : 'Profile'}</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input disabled placeholder="Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <FormLabel>Profile Picture</FormLabel>
                      <div className="flex flex-col gap-4">
                        {/* Current or preview image */}
                        {(previewUrl || profileData?.profile_picture) && (
                          <div className="relative w-24 h-24">
                            <Avatar className="w-24 h-24">
                              <AvatarImage 
                                src={previewUrl || profileData?.profile_picture} 
                                alt="Profile preview"
                                className="object-cover"
                              />
                              <AvatarFallback className="text-2xl">
                                {profileData?.username?.charAt(0) || user?.email?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {previewUrl && (
                              <button 
                                type="button"
                                onClick={clearSelectedImage}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                aria-label="Remove image"
                              >
                                <X className="h-4 w-4 text-white" />
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* File upload button */}
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => document.getElementById('profile-image')?.click()}
                            className="flex gap-2 items-center"
                          >
                            <Upload className="h-4 w-4" />
                            {previewUrl ? "Change Image" : "Upload Image"}
                          </Button>
                          <input
                            type="file"
                            id="profile-image"
                            accept="image/png, image/jpeg"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                          <span className="text-xs text-muted-foreground">PNG or JPG</span>
                        </div>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website Link</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://yourwebsite.com" 
                              {...field} 
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          clearSelectedImage();
                          form.reset({
                            username: profileData?.username || '',
                            email: profileData?.email || '',
                            profile_picture: profileData?.profile_picture || null,
                            website: profileData?.website || null,
                          });
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <LoadingSpinner className="mr-2" /> : null}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData?.profile_picture || undefined} alt={profileData?.username || "User"} />
                      <AvatarFallback className="text-lg">
                        {profileData?.username?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{profileData?.username}</h3>
                      <p className="text-muted-foreground">@{profileData?.username}</p>
                      {profileData?.website && (
                        <a 
                          href={profileData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm block mt-1"
                        >
                          {profileData.website}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <h4 className="text-sm font-medium">Email</h4>
                      <p className="text-muted-foreground">{profileData?.email || user?.email}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default ProfilePage;
