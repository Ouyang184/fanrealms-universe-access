
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Password change form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password must be at least 6 characters.",
  }),
  newPassword: z.string().min(6, {
    message: "New password must be at least 6 characters.",
  }),
  confirmNewPassword: z.string().min(6, {
    message: "Confirm password must be at least 6 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function AccountSettings() {
  const { isChecking } = useAuthCheck();
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    username: "",
    email: "",
    saving: false
  });
  
  // Change password dialog state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newContentAlerts: true,
    commentReplies: true,
    mentions: true,
    creatorUpdates: true,
    saving: false
  });
  
  // Form for password change
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });
  
  useEffect(() => {
    if (profile) {
      setAccountSettings({
        username: profile.username || "",
        email: user?.email || "",
        saving: false
      });
    }
  }, [profile, user]);
  
  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const saveAccountSettings = async () => {
    setAccountSettings(prev => ({ ...prev, saving: true }));
    try {
      // For email updates, we would need to call the appropriate Supabase auth method
      if (user?.email !== accountSettings.email) {
        // This is where you would update the email
        const { error } = await supabase.auth.updateUser({
          email: accountSettings.email,
        });
        
        if (error) throw error;
      }
      
      // Update the profile (username)
      if (profile?.username !== accountSettings.username) {
        await updateProfile({
          username: accountSettings.username
        });
      }
      
      toast({
        title: "Settings saved",
        description: "Your account settings have been updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setAccountSettings(prev => ({ ...prev, saving: false }));
    }
  };

  const handleChangePassword = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });
      
      // Reset form and close dialog
      form.reset();
      setChangePasswordOpen(false);
      
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message || "There was a problem updating your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const saveNotificationSettings = () => {
    setNotificationSettings(prev => ({ ...prev, saving: true }));
    // In a real app, we would save to the database here
    setTimeout(() => {
      toast({
        title: "Notification preferences saved",
        description: "Your notification settings have been updated"
      });
      setNotificationSettings(prev => ({ ...prev, saving: false }));
    }, 1000);
  };
  
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        <div className="mt-6 space-y-6">
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
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    name="username" 
                    value={accountSettings.username}
                    onChange={handleAccountChange}
                    placeholder="Enter your username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    value={accountSettings.email}
                    onChange={handleAccountChange}
                    placeholder="Enter your email address"
                  />
                  <p className="text-xs text-muted-foreground">
                    Changing your email will require verification
                  </p>
                </div>
                <div className="space-y-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setChangePasswordOpen(true)}
                  >
                    Change Password
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={saveAccountSettings} 
                  disabled={accountSettings.saving}
                >
                  {accountSettings.saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
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

      {/* Password Change Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter current password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter new password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm new password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setChangePasswordOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
