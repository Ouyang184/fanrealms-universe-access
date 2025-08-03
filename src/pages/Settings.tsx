
import React, { useRef, useState } from "react";
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { AgeVerificationModal } from "@/components/nsfw/AgeVerificationModal";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { ContentPreferencesTab } from "@/components/settings/ContentPreferencesTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { Camera } from "lucide-react";
import { useUnifiedAvatar } from "@/hooks/useUnifiedAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { isChecking, user } = useAuthCheck();
  const { profile } = useAuth();
  const { getAvatarUrl, uploadAvatar, isCreator } = useUnifiedAvatar();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const {
    isAgeVerified,
    showVerificationModal,
    setShowVerificationModal,
    handleAgeVerified
  } = useAgeVerification();

  console.log('🏠 Settings Page - Age verification state:', {
    isAgeVerified,
    showVerificationModal,
    userId: user?.id
  });

  const handleAgeVerificationSuccess = async (dateOfBirth: string) => {
    console.log('🎯 Settings - Age verification success callback');
    await handleAgeVerified(dateOfBirth);
  };

  const handleAgeVerificationCancel = () => {
    console.log('❌ Settings - Age verification cancelled');
    setShowVerificationModal(false);
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

    setUploadingAvatar(true);
    
    try {
      await uploadAvatar(file);
      // The upload function handles the toast notifications
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setUploadingAvatar(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <div className="space-y-8 p-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences</p>
            </div>
            
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="flex flex-wrap w-full h-auto bg-muted p-1 rounded-lg">
                <TabsTrigger 
                  value="account" 
                  className="text-xs sm:text-sm px-2 py-2"
                >
                  Account
                </TabsTrigger>
                <TabsTrigger 
                  value="profile" 
                  className="text-xs sm:text-sm px-2 py-2"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="text-xs sm:text-sm px-2 py-2"
                >
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="text-xs sm:text-sm px-2 py-2"
                >
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="text-xs sm:text-sm px-2 py-2"
                >
                  Privacy
                </TabsTrigger>
                <TabsTrigger 
                  value="content" 
                  className="text-xs sm:text-sm px-2 py-2"
                >
                  Content Preferences
                </TabsTrigger>
              </TabsList>
              <div className="mt-6 space-y-6">
                <TabsContent value="profile" className="m-0">
                  <ProfileTab user={user} />
                </TabsContent>
                
                <TabsContent value="account" className="m-0">
                  <div className="space-y-6">
                    {/* Avatar Upload Section - Top Priority */}
                    <Card className="border-2 border-primary/20">
                      <CardHeader className="text-center">
                        <CardTitle className="text-xl">Profile Picture</CardTitle>
                        <CardDescription>
                          Upload and manage your avatar image
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Debug Info */}
                        <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg text-sm border">
                          <h4 className="font-medium mb-2">Debug Information:</h4>
                          <p>Profile: {profile?.username || 'No profile'}</p>
                          <p>Is Creator: {isCreator.toString()}</p>
                          <p>Avatar URL: {getAvatarUrl(profile) || 'No avatar'}</p>
                          <p>User ID: {user?.id || 'No user'}</p>
                        </div>
                        
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center space-y-4">
                          <Avatar className="h-32 w-32 border-4 border-primary/30 shadow-lg">
                            <AvatarImage 
                              src={getAvatarUrl(profile) || ""} 
                              alt="Profile picture" 
                            />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                              {profile?.username?.substring(0, 1).toUpperCase() || user?.email?.substring(0, 1).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <Button 
                            type="button" 
                            variant="default" 
                            size="lg"
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            className="flex items-center gap-2 px-6 py-3"
                          >
                            <Camera className={`h-5 w-5 ${uploadingAvatar ? 'animate-spin' : ''}`} />
                            {uploadingAvatar ? "Uploading..." : "Upload New Avatar"}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-muted-foreground text-center max-w-sm">
                            Supported formats: JPG, PNG, GIF (max 5MB)
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Account Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                        <CardDescription>
                          View your account details
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                       {/* User Information */}
                       <div className="space-y-4">
                         <div className="space-y-2">
                           <Label htmlFor="username">Username</Label>
                           <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                             {profile?.username || 'Not set'}
                           </div>
                         </div>
                         
                         <div className="space-y-2">
                           <Label htmlFor="email">Email</Label>
                           <div className="text-sm text-muted-foreground bg-muted p-2 rounded-md">
                             {user?.email}
                           </div>
                         </div>
                         
                         <div className="pt-4">
                           <Button variant="outline" className="w-full">
                             Change Password
                           </Button>
                         </div>
                       </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="security" className="m-0">
                  <SecurityTab />
                </TabsContent>
                
                <TabsContent value="notifications" className="m-0">
                  <NotificationsTab />
                </TabsContent>
                
                <TabsContent value="content" className="m-0">
                  <ContentPreferencesTab 
                    user={user}
                    isAgeVerified={isAgeVerified}
                    showVerificationModal={showVerificationModal}
                    setShowVerificationModal={setShowVerificationModal}
                    handleAgeVerified={handleAgeVerified}
                  />
                </TabsContent>
                
                <TabsContent value="privacy" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Settings</CardTitle>
                      <CardDescription>
                        Manage your privacy and security preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Profile Visibility</Label>
                          <p className="text-sm text-muted-foreground">
                            Make your profile visible to others
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Activity Status</Label>
                          <p className="text-sm text-muted-foreground">
                            Show when you're active on the platform
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="pt-4">
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Age Verification Modal */}
      <AgeVerificationModal
        open={showVerificationModal}
        onVerified={handleAgeVerificationSuccess}
        onCancel={handleAgeVerificationCancel}
      />
    </SidebarProvider>
  );
}
