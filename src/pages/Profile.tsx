import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { useProfile, ProfileData } from '@/hooks/useProfile';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { X, Upload } from 'lucide-react';

const AVAILABLE_TAGS = [
  "Gaming", "Art", "Music", "Writing", "Photography", "Education",
  "Fitness", "Cooking", "Technology", "Travel", "Fashion", "Design", 
  "Podcasting", "Comedy", "Film", "Dance", "Science", "Finance", 
  "Business", "Crafts", "Beauty", "Health", "Lifestyle", "Sports",
  "News", "Politics", "History", "Nature", "Automotive", "Real Estate"
];

// Form validation schema
const profileSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email().optional(),
  profile_picture: z.string().optional().nullable(),
  website: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Be careful not to use Profile as the component name since it conflicts with the Profile type
const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const { fetchUserProfile, updateProfile, uploadProfileImage } = useProfile();
  const { toast } = useToast();

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      profile_picture: '',
      website: '',
      bio: '',
      tags: [],
    } satisfies ProfileFormValues
  });

  useEffect(() => {
    async function loadProfile() {
      if (user?.id) {
        setLoading(true);
        const profile = await fetchUserProfile(user.id);
        setProfileData(profile);
        
        // Reset form with profile data
        if (profile) {
          const formData: ProfileFormValues = {
            username: profile.username || '',
            email: profile.email || '',
            profile_picture: profile.profile_picture || '',
            website: profile.website || '',
            bio: profile.bio || '',
            tags: profile.tags || [],
          };
          form.reset(formData);
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

  const handleTagAdd = (tag: string) => {
    if (!tag) return;
    
    const currentTags = form.getValues('tags') || [];
    if (currentTags.includes(tag)) return;
    
    form.setValue('tags', [...currentTags, tag]);
    setSelectedTag("");
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues('tags') || [];
    const updatedTags = currentTags.filter(t => t !== tag);
    form.setValue('tags', updatedTags);
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
        bio: formData.bio,
        tags: formData.tags,
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

  // Get available tags for dropdown (exclude already selected ones)
  const currentTags = form.watch('tags') || [];
  const availableOptions = AVAILABLE_TAGS.filter(tag => !currentTags.includes(tag));

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
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Tell others about yourself..."
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-2">
                      <FormLabel htmlFor="tags">Content Tags</FormLabel>
                      <div className="space-y-3">
                        <Select value={selectedTag} onValueChange={handleTagAdd}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a content tag to add..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg max-h-64 overflow-y-auto z-50">
                            {availableOptions.map((tag) => (
                              <SelectItem key={tag} value={tag} className="cursor-pointer hover:bg-accent">
                                {tag}
                              </SelectItem>
                            ))}
                            {availableOptions.length === 0 && (
                              <SelectItem value="" disabled className="text-muted-foreground">
                                All available tags have been selected
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        
                        {/* Display selected tags */}
                        {currentTags && currentTags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {currentTags.map((tag) => (
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
                          Select tags that describe your content. This helps others discover your profile. You have selected {currentTags?.length || 0} tag{currentTags?.length !== 1 ? 's' : ''}.
                        </p>
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
                          const formData: ProfileFormValues = {
                            username: profileData?.username || '',
                            email: profileData?.email || '',
                            profile_picture: profileData?.profile_picture || '',
                            website: profileData?.website || '',
                            bio: profileData?.bio || '',
                            tags: profileData?.tags || [],
                          };
                          form.reset(formData);
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

                  {profileData?.bio && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Bio</h4>
                      <p className="text-muted-foreground">{profileData.bio}</p>
                    </div>
                  )}

                  {/* Content Tags Section */}
                  {profileData?.tags && profileData.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Content Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="px-3 py-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

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
