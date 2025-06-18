import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { AgeVerificationModal } from "@/components/nsfw/AgeVerificationModal";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { isChecking, user } = useAuthCheck();
  const { toast } = useToast();
  
  // Profile settings state
  const [profileSettings, setProfileSettings] = useState({
    name: "",
    username: "",
    bio: "",
    website: "",
    saving: false
  });
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newContentAlerts: true,
    commentReplies: true,
    mentions: true,
    creatorUpdates: true,
    saving: false
  });
  
  // NSFW settings state
  const [nsfwSettings, setNSFWSettings] = useState({
    isNSFWEnabled: false,
    saving: false
  });

  const {
    isAgeVerified,
    showVerificationModal,
    setShowVerificationModal,
    handleAgeVerified,
    isLoading: isAgeVerificationLoading
  } = useAgeVerification();
  
  useEffect(() => {
    console.log('🔍 Settings useEffect - Age verification status:', {
      isAgeVerified,
      isAgeVerificationLoading,
      user: user?.id,
      showVerificationModal
    });
  }, [isAgeVerified, isAgeVerificationLoading, user, showVerificationModal]);
  
  useEffect(() => {
    if (!isChecking && user) {
      // Load profile settings (in a real app, would fetch from API/context)
      setProfileSettings({
        name: user.user_metadata?.full_name || "John Doe",
        username: user.user_metadata?.username || "johndoe",
        bio: "Digital creator and tech enthusiast",
        website: "https://example.com",
        saving: false
      });
      
      // Fetch NSFW preferences
      const fetchNSFWPrefs = async () => {
        try {
          console.log('Fetching NSFW preferences for user:', user.id);
          const { data } = await supabase
            .from('users')
            .select('is_nsfw_enabled')
            .eq('id', user.id)
            .single();
          
          const nsfwEnabled = data?.is_nsfw_enabled || false;
          console.log('Current NSFW setting from database:', nsfwEnabled);
          
          setNSFWSettings(prev => ({
            ...prev,
            isNSFWEnabled: nsfwEnabled
          }));
        } catch (error) {
          console.error('Error fetching NSFW preferences:', error);
        }
      };
      
      fetchNSFWPrefs();
    }
  }, [isChecking, user]);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleNSFWChange = async (enabled: boolean) => {
    console.log('🔥 NSFW toggle clicked:', { 
      enabled, 
      isAgeVerified, 
      isAgeVerificationLoading,
      currentNSFWState: nsfwSettings.isNSFWEnabled,
      showVerificationModal
    });
    
    // If trying to disable NSFW, allow it immediately
    if (!enabled) {
      console.log('✅ User is disabling NSFW - proceeding immediately');
      setNSFWSettings(prev => ({ ...prev, isNSFWEnabled: false, saving: true }));
      
      try {
        await supabase
          .from('users')
          .update({ is_nsfw_enabled: false })
          .eq('id', user?.id);
        
        console.log('✅ NSFW preference disabled successfully');
        toast({
          title: "NSFW content disabled",
          description: "You will no longer see mature content.",
        });
      } catch (error) {
        console.error('❌ Error saving NSFW settings:', error);
        setNSFWSettings(prev => ({ ...prev, isNSFWEnabled: true }));
        toast({
          title: "Error",
          description: "Failed to update NSFW settings.",
          variant: "destructive",
        });
      } finally {
        setNSFWSettings(prev => ({ ...prev, saving: false }));
      }
      return;
    }
    
    // If trying to enable NSFW, check age verification first
    console.log('🚨 User is trying to enable NSFW. Checking age verification...');
    console.log('🔍 Age verification details:', { isAgeVerified, isAgeVerificationLoading });
    
    // Show modal when enabling NSFW if not age verified
    if (enabled && !isAgeVerified) {
      console.log('🚨 User is not age verified - showing verification modal');
      setShowVerificationModal(true);
      return;
    }

    // If enabling NSFW and already age verified, proceed with the change
    console.log('✅ User is age verified - proceeding with NSFW toggle to:', enabled);
    setNSFWSettings(prev => ({ ...prev, isNSFWEnabled: enabled, saving: true }));
    
    try {
      await supabase
        .from('users')
        .update({ is_nsfw_enabled: enabled })
        .eq('id', user?.id);
      
      console.log('✅ NSFW preference updated successfully to:', enabled);
      toast({
        title: "NSFW content enabled",
        description: "You can now view mature content.",
      });
    } catch (error) {
      console.error('❌ Error saving NSFW settings:', error);
      setNSFWSettings(prev => ({ ...prev, isNSFWEnabled: !enabled }));
      toast({
        title: "Error",
        description: "Failed to update NSFW settings.",
        variant: "destructive",
      });
    } finally {
      setNSFWSettings(prev => ({ ...prev, saving: false }));
    }
  };

  const handleAgeVerificationSuccess = async (dateOfBirth: string) => {
    console.log('🎉 Age verification successful, enabling NSFW');
    
    // First handle age verification
    await handleAgeVerified(dateOfBirth);
    
    // Then enable NSFW content
    setNSFWSettings(prev => ({ ...prev, isNSFWEnabled: true, saving: true }));
    
    try {
      await supabase
        .from('users')
        .update({ is_nsfw_enabled: true })
        .eq('id', user?.id);
      
      console.log('✅ NSFW enabled after age verification');
      toast({
        title: "Age verified and NSFW enabled",
        description: "You can now view mature content.",
      });
    } catch (error) {
      console.error('❌ Error enabling NSFW settings:', error);
      toast({
        title: "Error",
        description: "Age verified but failed to enable NSFW settings.",
        variant: "destructive",
      });
    } finally {
      setNSFWSettings(prev => ({ ...prev, saving: false }));
    }
  };

  const handleAgeVerificationCancel = () => {
    console.log('❌ Age verification cancelled');
    setShowVerificationModal(false);
    // Don't enable NSFW if verification was cancelled
  };
  
  const saveProfileSettings = async () => {
    setProfileSettings(prev => ({ ...prev, saving: true }));
    
    try {
      // Update auth metadata (for name)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileSettings.name,
          username: profileSettings.username
        }
      });

      if (authError) throw authError;

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: profileSettings.username,
          website: profileSettings.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProfileSettings(prev => ({ ...prev, saving: false }));
    }
  };
  
  const saveNotificationSettings = async () => {
    setNotificationSettings(prev => ({ ...prev, saving: true }));
    
    // In a real app, you would save these to a user_preferences table
    // For now, just simulate the API call
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setNotificationSettings(prev => ({ ...prev, saving: false }));
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
            
            <Tabs defaultValue="profile" className="w-full">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              <div className="mt-6 space-y-6">
                <TabsContent value="profile" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your public profile information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input 
                            id="name" 
                            name="name" 
                            value={profileSettings.name}
                            onChange={handleProfileChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input 
                            id="username" 
                            name="username" 
                            value={profileSettings.username}
                            onChange={handleProfileChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Input 
                          id="bio" 
                          name="bio" 
                          value={profileSettings.bio}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input 
                          id="website" 
                          name="website" 
                          type="url"
                          value={profileSettings.website}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={saveProfileSettings} 
                        disabled={profileSettings.saving}
                      >
                        {profileSettings.saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="account" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account details and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                
                <TabsContent value="notifications" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Control how and when you receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch 
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>New Content Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when creators you follow post new content
                          </p>
                        </div>
                        <Switch 
                          checked={notificationSettings.newContentAlerts}
                          onCheckedChange={(checked) => handleNotificationChange("newContentAlerts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Comment Replies</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when someone replies to your comments
                          </p>
                        </div>
                        <Switch 
                          checked={notificationSettings.commentReplies}
                          onCheckedChange={(checked) => handleNotificationChange("commentReplies", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Mentions</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when you're mentioned in a post or comment
                          </p>
                        </div>
                        <Switch 
                          checked={notificationSettings.mentions}
                          onCheckedChange={(checked) => handleNotificationChange("mentions", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Creator Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about important updates from creators you follow
                          </p>
                        </div>
                        <Switch 
                          checked={notificationSettings.creatorUpdates}
                          onCheckedChange={(checked) => handleNotificationChange("creatorUpdates", checked)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={saveNotificationSettings} 
                        disabled={notificationSettings.saving}
                      >
                        {notificationSettings.saving ? "Saving..." : "Save Preferences"}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Content Preferences</CardTitle>
                      <CardDescription>
                        Manage your content viewing preferences and restrictions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Show NSFW Posts</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable viewing of mature/adult content (requires age verification)
                          </p>
                        </div>
                        <Switch 
                          checked={nsfwSettings.isNSFWEnabled}
                          onCheckedChange={handleNSFWChange}
                          disabled={nsfwSettings.saving}
                        />
                      </div>
                      
                      {nsfwSettings.isNSFWEnabled && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-800">
                              <p className="font-medium mb-1">NSFW Content Enabled</p>
                              <p className="text-xs">
                                You have verified your age and can now view mature content across the platform.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Debug information */}
                      <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600 font-mono">
                          Debug: Age Verified: {String(isAgeVerified)} | NSFW Enabled: {nsfwSettings.isNSFWEnabled ? 'Yes' : 'No'} | Modal Open: {showVerificationModal ? 'Yes' : 'No'} | Loading: {isAgeVerificationLoading ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
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
