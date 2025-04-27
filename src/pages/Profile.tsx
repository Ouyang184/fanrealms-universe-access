
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

// Be careful not to use Profile as the component name since it conflicts with the Profile type
const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    profile_picture: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        profile_picture: profile.profile_picture || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium">
                      Username
                    </label>
                    <Input 
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">
                      Email
                    </label>
                    <Input 
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile_picture" className="block text-sm font-medium">
                      Profile Picture URL
                    </label>
                    <Input 
                      id="profile_picture"
                      name="profile_picture"
                      value={formData.profile_picture}
                      onChange={handleChange}
                      placeholder="Enter your profile picture URL"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsEditing(false)}
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
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.profile_picture || undefined} alt={profile?.username || "User"} />
                      <AvatarFallback className="text-lg">
                        {profile?.username?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{profile?.username}</h3>
                      <p className="text-muted-foreground">@{profile?.username}</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <h4 className="text-sm font-medium">Email</h4>
                      <p className="text-muted-foreground">{user?.email}</p>
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
