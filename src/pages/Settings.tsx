
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
import { useUnifiedAvatar } from "@/hooks/useUnifiedAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";
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
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account details and preferences
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
                              {profile?.username?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={user?.email || ""}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">
                          To change your email, please contact support
                        </p>
                      </div>
                      <div className="space-y-2 pt-4">
                        <Button variant="outline">Change Password</Button>
                      </div>
                    </CardContent>
                  </Card>
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
