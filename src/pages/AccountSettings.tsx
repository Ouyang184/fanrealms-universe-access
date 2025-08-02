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
import { CategoryGrid } from "@/components/onboarding/CategoryGrid";
import { useNSFWPreference } from "@/hooks/useNSFWPreference";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { AgeVerificationModal } from "@/components/nsfw/AgeVerificationModal";
import { Link } from "react-router-dom";
import { Shield, Smartphone, Monitor, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  
  // Age verification hook
  const {
    isAgeVerified,
    showVerificationModal,
    setShowVerificationModal,
    handleAgeVerified
  } = useAgeVerification();

  // NSFW preference hook with age verification callback
  const { showNSFW, isLoading: nsfwLoading, updateNSFWPreference, isUpdating: nsfwUpdating } = useNSFWPreference({
    onAgeVerificationRequired: async (): Promise<boolean> => {
      console.log('🎯 AccountSettings - Age verification required - showing modal');
      setShowVerificationModal(true);
      
      // Wait for age verification to complete
      return new Promise((resolve) => {
        let checkCount = 0;
        const maxChecks = 60; // 30 seconds with 500ms intervals
        
        const checkVerification = () => {
          checkCount++;
          console.log(`🔍 AccountSettings - Checking verification status (attempt ${checkCount}/${maxChecks}):`, {
            isAgeVerified,
            showVerificationModal,
            checkCount
          });
          
          if (isAgeVerified && !showVerificationModal) {
            console.log('✅ AccountSettings - Age verification completed successfully');
            resolve(true);
            return;
          }
          
          if (checkCount >= maxChecks) {
            console.log('❌ AccountSettings - Age verification timeout after 30 seconds');
            resolve(false);
            return;
          }
          
          // Check again in 500ms
          setTimeout(checkVerification, 500);
        };
        
        // Start checking after a brief delay
        setTimeout(checkVerification, 100);
      });
    }
  });
  
  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    username: "",
    email: "",
    saving: false
  });
  
  // Preferences state
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  
  // Change password dialog state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: '30',
    blockSuspiciousLogins: true,
    saving: false
  });
  
  // Mock active sessions data
  const [activeSessions] = useState([
    {
      id: '1',
      device: 'Windows PC - Chrome',
      location: 'New York, USA',
      lastActive: '2 minutes ago',
      isCurrent: true,
      ip: '192.168.1.1'
    },
    {
      id: '2', 
      device: 'iPhone 15 - Safari',
      location: 'New York, USA',
      lastActive: '1 hour ago',
      isCurrent: false,
      ip: '192.168.1.2'
    },
    {
      id: '3',
      device: 'MacBook Pro - Safari', 
      location: 'Los Angeles, USA',
      lastActive: '3 days ago',
      isCurrent: false,
      ip: '192.168.1.3'
    }
  ]);
  
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
    
    if (user) {
      loadUserPreferences();
    }
  }, [profile, user]);

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('category_id')
        .eq('user_id', user?.id)
        .neq('category_name', 'nsfw_content'); // Exclude NSFW preference since it's handled by the hook

      if (error) throw error;

      if (data) {
        setSelectedCategories(data.map(pref => pref.category_id));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleCategoryToggle = (id: number) => {
    setSelectedCategories((prev) => 
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const savePreferences = async () => {
    if (selectedCategories.length < 4) {
      toast({
        title: "Select at least 4 categories",
        description: "Please select at least 4 categories to personalize your experience.",
        variant: "destructive"
      });
      return;
    }

    setPreferencesSaving(true);
    try {
      // Delete existing content category preferences (but keep NSFW preference)
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user?.id)
        .neq('category_name', 'nsfw_content');

      // Insert new preferences
      const preferences = selectedCategories.map(categoryId => ({
        user_id: user?.id,
        category_id: categoryId,
        category_name: getCategoryName(categoryId)
      }));

      const { error } = await supabase
        .from('user_preferences')
        .insert(preferences);

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your content preferences have been updated successfully."
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPreferencesSaving(false);
    }
  };

  const getCategoryName = (id: number) => {
    const categories = [
      { id: 1, name: "Art & Illustration" },
      { id: 2, name: "Gaming" },
      { id: 3, name: "Music" },
      { id: 4, name: "Writing" },
      { id: 5, name: "Photography" },
      { id: 6, name: "Education" },
      { id: 7, name: "Podcasts" },
      { id: 8, name: "Cooking" },
      { id: 9, name: "Fitness" },
      { id: 10, name: "Technology" },
      { id: 11, name: "Fashion" },
      { id: 12, name: "Film & Video" },
    ];
    return categories.find(cat => cat.id === id)?.name || "";
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key: string, value: boolean | string) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNSFWToggle = (checked: boolean) => {
    console.log('AccountSettings - NSFW toggle clicked:', checked);
    updateNSFWPreference(checked);
  };

  const handleAgeVerificationSuccess = async (dateOfBirth: string) => {
    console.log('🎯 AccountSettings - Age verification success callback');
    await handleAgeVerified(dateOfBirth);
  };

  const handleAgeVerificationCancel = () => {
    console.log('❌ AccountSettings - Age verification cancelled');
    setShowVerificationModal(false);
  };

  const handleSessionLogout = (sessionId: string) => {
    // In a real app, this would call an API to invalidate the session
    toast({
      title: "Session ended",
      description: "The selected session has been logged out.",
    });
  };

  const handleLogoutAllOtherSessions = () => {
    // In a real app, this would call an API to invalidate all other sessions
    toast({
      title: "All other sessions logged out",
      description: "You have been logged out of all other devices.",
    });
  };

  const enable2FA = () => {
    // In a real app, this would initiate 2FA setup
    toast({
      title: "Two-Factor Authentication",
      description: "2FA setup would be initiated here.",
    });
  };

  const disable2FA = () => {
    // In a real app, this would disable 2FA after confirmation
    toast({
      title: "Two-Factor Authentication Disabled",
      description: "2FA has been disabled for your account.",
    });
    setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
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

  const saveSecuritySettings = () => {
    setSecuritySettings(prev => ({ ...prev, saving: true }));
    // In a real app, we would save to the database here
    setTimeout(() => {
      toast({
        title: "Security settings saved",
        description: "Your security preferences have been updated"
      });
      setSecuritySettings(prev => ({ ...prev, saving: false }));
    }, 1000);
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
    <>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>
        
        <Tabs defaultValue="account" className="w-full">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="preferences">Content Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
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
            
            <TabsContent value="preferences" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Content Preferences</CardTitle>
                  <CardDescription>
                    Choose the types of content you want to see in your feed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {preferencesLoading ? (
                    <div className="flex justify-center">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <>
                      <CategoryGrid 
                        selectedCategories={selectedCategories} 
                        onToggle={handleCategoryToggle} 
                      />
                      <div className="text-sm text-muted-foreground">
                        {selectedCategories.length} of 12 categories selected
                        {selectedCategories.length < 4 && (
                          <span className="text-red-500 ml-2">
                            (Select at least 4)
                          </span>
                        )}
                      </div>
                    </>
                  )}

                  {/* NSFW Content Preference */}
                  <div className="border-t pt-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium">Adult Content</h4>
                        <p className="text-sm text-muted-foreground">
                          Control whether you see adult/mature content in your feed
                        </p>
                      </div>
                      
                      {nsfwLoading ? (
                        <div className="flex justify-center">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-0.5">
                            <Label htmlFor="nsfw-toggle">Show NSFW Posts</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow adult/mature content to appear in your feed
                            </p>
                          </div>
                          <Switch 
                            id="nsfw-toggle"
                            checked={showNSFW}
                            onCheckedChange={handleNSFWToggle}
                            disabled={nsfwUpdating}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={savePreferences} 
                    disabled={preferencesSaving || selectedCategories.length < 4}
                  >
                    {preferencesSaving ? "Saving..." : "Save Preferences"}
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
            
            <TabsContent value="security" className="m-0">
              <div className="space-y-6">
                {/* Password Security */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Password & Authentication
                    </CardTitle>
                    <CardDescription>
                      Manage your password and authentication methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label>Password</Label>
                        <p className="text-sm text-muted-foreground">
                          Last changed: {new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setChangePasswordOpen(true)}
                      >
                        Change Password
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2">
                          Two-Factor Authentication
                          {securitySettings.twoFactorEnabled && (
                            <Badge variant="default" className="text-xs">Enabled</Badge>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      {securitySettings.twoFactorEnabled ? (
                        <Button variant="destructive" onClick={disable2FA}>
                          Disable 2FA
                        </Button>
                      ) : (
                        <Button onClick={enable2FA}>
                          Enable 2FA
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Login Security */}
                <Card>
                  <CardHeader>
                    <CardTitle>Login Security</CardTitle>
                    <CardDescription>
                      Control login behavior and security alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Login Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when someone logs into your account
                        </p>
                      </div>
                      <Switch 
                        checked={securitySettings.loginAlerts}
                        onCheckedChange={(checked) => handleSecurityChange("loginAlerts", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Block Suspicious Logins</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically block login attempts from unusual locations
                        </p>
                      </div>
                      <Switch 
                        checked={securitySettings.blockSuspiciousLogins}
                        onCheckedChange={(checked) => handleSecurityChange("blockSuspiciousLogins", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Session Timeout</Label>
                      <select 
                        className="w-full p-2 border rounded-md bg-background"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => handleSecurityChange("sessionTimeout", e.target.value)}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="240">4 hours</option>
                        <option value="720">12 hours</option>
                        <option value="never">Never</option>
                      </select>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after period of inactivity
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={saveSecuritySettings} 
                      disabled={securitySettings.saving}
                    >
                      {securitySettings.saving ? "Saving..." : "Save Security Settings"}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Active Sessions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Active Sessions
                    </CardTitle>
                    <CardDescription>
                      Manage devices and browsers that are currently logged in
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          {session.device.includes('iPhone') || session.device.includes('Android') ? (
                            <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          ) : (
                            <Monitor className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{session.device}</p>
                              {session.isCurrent && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {session.location} • Last active {session.lastActive}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              IP: {session.ip}
                            </p>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSessionLogout(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={handleLogoutAllOtherSessions}
                    >
                      Log Out All Other Sessions
                    </Button>
                  </CardFooter>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment & Billing Security</CardTitle>
                    <CardDescription>
                      Manage your payment methods and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label>Payment Methods</Label>
                        <p className="text-sm text-muted-foreground">
                          Manage your saved payment methods and billing security
                        </p>
                      </div>
                      <Link to="/payment-methods">
                        <Button variant="outline" className="gap-2">
                          Manage Payment Methods
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Data & Download */}
                <Card>
                  <CardHeader>
                    <CardTitle>Data & Privacy</CardTitle>
                    <CardDescription>
                      Download your data or delete your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label>Download Your Data</Label>
                        <p className="text-sm text-muted-foreground">
                          Get a copy of your account data, posts, and activity
                        </p>
                      </div>
                      <Button variant="outline">
                        Request Download
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="space-y-1">
                        <Label className="text-destructive">Delete Account</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button variant="destructive">
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                  {/* Cookie Preferences Section */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Cookie Preferences</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage your cookie and tracking preferences
                      </p>
                    </div>
                    
                    <div className="space-y-4 pl-4 border-l-2 border-muted">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Essential Cookies</Label>
                          <p className="text-sm text-muted-foreground">
                            Required for login, security, and basic functions (always active)
                          </p>
                        </div>
                        <Switch checked disabled />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Functional Cookies</Label>
                          <p className="text-sm text-muted-foreground">
                            Remember your preferences like theme and content settings
                          </p>
                        </div>
                        <Switch 
                          checked={localStorage.getItem('cookie-consent') === 'accepted'}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              localStorage.setItem('cookie-consent', 'accepted');
                              toast({
                                title: "Cookie preferences updated",
                                description: "Functional cookies are now enabled."
                              });
                            } else {
                              localStorage.setItem('cookie-consent', 'denied');
                              toast({
                                title: "Cookie preferences updated", 
                                description: "Non-essential cookies are now disabled."
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      <p className="mb-2">
                        <strong>Note:</strong> We don't use advertising or tracking cookies.
                      </p>
                      <p>
                        You can also manage cookies through your browser settings. 
                        View our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link> for more details.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Privacy Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Control your profile visibility and activity
                      </p>
                    </div>
                    
                    <div className="space-y-4">
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
                    </div>
                  </div>

                  <div className="border-t pt-6">
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

        {/* Age Verification Modal */}
        <AgeVerificationModal
          open={showVerificationModal}
          onVerified={handleAgeVerificationSuccess}
          onCancel={handleAgeVerificationCancel}
        />
      </div>
    </>
  );
}
