import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function Settings() {
  const { isChecking, user } = useAuthCheck();
  const { toast } = useToast();
  const { signOut } = useAuth();
  
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
  
  useEffect(() => {
    if (!isChecking && user) {
      // In a real app, would fetch from API/context
      setProfileSettings({
        name: user.user_metadata?.full_name || "John Doe",
        username: user.user_metadata?.username || "johndoe",
        bio: "Digital creator and tech enthusiast",
        website: "https://example.com",
        saving: false
      });
    }
  }, [isChecking, user]);
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const saveProfileSettings = () => {
    setProfileSettings(prev => ({ ...prev, saving: true }));
    // Simulate API call
    setTimeout(() => {
      setProfileSettings(prev => ({ ...prev, saving: false }));
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved"
      });
    }, 1000);
  };
  
  const saveNotificationSettings = () => {
    setNotificationSettings(prev => ({ ...prev, saving: true }));
    // Simulate API call
    setTimeout(() => {
      setNotificationSettings(prev => ({ ...prev, saving: false }));
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved"
      });
    }, 1000);
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
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
      <div className="flex h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold">Settings</h1>
                    <p className="text-muted-foreground">Manage your account preferences</p>
                  </div>
                  <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="profile" className="w-full">
                <TabsList>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
