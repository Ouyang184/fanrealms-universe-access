
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { useProfile, ProfileData } from '@/hooks/useProfile';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProfileDisplay } from '@/components/profile/ProfileDisplay';
import { ProfileEditForm } from '@/components/profile/ProfileEditForm';

// Form validation schema
const profileSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  email: z.string().email().optional(),
  profile_picture: z.string().optional().nullable(),
  website: z.string().url({ message: "Must be a valid URL" }).optional().or(z.literal('')).nullable(),
  bio: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { fetchUserProfile, updateProfile, uploadProfileImage } = useProfile();
  const { toast } = useToast();

  // Initialize form with react-hook-form with explicit typing
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      profile_picture: null,
      website: null,
      bio: null,
      tags: [],
    } as ProfileFormValues
  });

  useEffect(() => {
    async function loadProfile() {
      if (user?.id) {
        setLoading(true);
        const profile = await fetchUserProfile(user.id);
        setProfileData(profile);
        
        if (profile) {
          form.reset({
            username: profile.username || '',
            email: profile.email || '',
            profile_picture: profile.profile_picture || null,
            website: profile.website || null,
            bio: profile.bio || null,
            tags: profile.tags || [],
          } as ProfileFormValues);
        }
        
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [user, fetchUserProfile, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
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
      
      let imageUrl = formData.profile_picture;
      if (selectedFile) {
        imageUrl = await uploadProfileImage(user.id, selectedFile);
        if (!imageUrl) {
          setIsSubmitting(false);
          return;
        }
      }
      
      const updateData = {
        username: formData.username,
        profile_picture: imageUrl,
        website: formData.website,
        bio: formData.bio,
        tags: formData.tags,
      };
      
      const updatedProfile = await updateProfile(user.id, updateData);
      
      if (updatedProfile) {
        setProfileData(updatedProfile);
        setIsEditing(false);
        clearSelectedImage();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    clearSelectedImage();
    form.reset({
      username: profileData?.username || '',
      email: profileData?.email || '',
      profile_picture: profileData?.profile_picture || null,
      website: profileData?.website || null,
      bio: profileData?.bio || null,
      tags: profileData?.tags || [],
    } as ProfileFormValues);
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
                <ProfileEditForm
                  form={form}
                  profileData={profileData}
                  userEmail={user?.email}
                  isSubmitting={isSubmitting}
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  onSubmit={onSubmit}
                  onCancel={handleCancel}
                  onImageChange={handleImageChange}
                  onClearImage={clearSelectedImage}
                />
              ) : (
                <ProfileDisplay
                  profileData={profileData!}
                  userEmail={user?.email}
                  onEditClick={() => setIsEditing(true)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default ProfilePage;
