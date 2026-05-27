import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Shield, Camera, Mail, ArrowRight, Smartphone, X } from "lucide-react";
import { SocialLinksEditor, normalizeSocialUrl, type SocialLinkDraft } from '@/components/profile/SocialLinksEditor';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUnifiedAvatar } from "@/hooks/useUnifiedAvatar";
import { EmailMFASetup } from "@/components/auth/EmailMFASetup";
import { MFAEnrollment } from "@/components/auth/MFAEnrollment";
import { useMFA } from "@/hooks/useMFA";
import { useEmailMFA } from "@/hooks/useEmailMFA";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatorFeeRate, useUpdateCreatorFeeRate } from '@/hooks/useCreatorEarnings';
import { useStripeConnect } from '@/hooks/useStripeConnect';

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

function PayoutsTab() {
  const { data: feeRate, isLoading: feeLoading } = useCreatorFeeRate();
  const updateFeeRate = useUpdateCreatorFeeRate();
  const { connectStatus, createConnectAccount, createLoginLink, isLoading: connectLoading } = useStripeConnect();
  const { user } = useAuth();
  const { toast } = useToast();
  const [creatorId, setCreatorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('creators').select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setCreatorId(data?.id ?? null));
  }, [user?.id]);

  const handleFeeChange = async (rate: number) => {
    if (rate === currentRate) return;
    try {
      await updateFeeRate.mutateAsync(rate);
      toast({ title: 'Fee rate updated', description: `You now keep ${100 - rate}% of each sale.` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update fee rate.', variant: 'destructive' });
    }
  };

  const isConnected = !!connectStatus?.stripe_charges_enabled;
  const currentRate = feeRate ?? 5;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Stripe Payouts</CardTitle>
          <CardDescription className="text-[13px]">
            Connect your Stripe account to receive earnings from asset sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[13px] font-medium">Stripe connected</span>
              </div>
              <Button variant="outline" size="sm" onClick={createLoginLink} disabled={connectLoading}>
                Open Stripe Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[13px] text-muted-foreground">Not connected</span>
              </div>
              <Button size="sm" onClick={() => creatorId && createConnectAccount(creatorId)} disabled={connectLoading || !creatorId}>
                Connect Stripe
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Platform Fee</CardTitle>
          <CardDescription className="text-[13px]">
            The percentage FanRealms keeps from each sale. You keep the rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feeLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleFeeChange(rate)}
                    disabled={updateFeeRate.isPending}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${
                      currentRate === rate
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-[#555] border-[#eee] hover:border-primary hover:text-primary'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-muted-foreground">
                At {currentRate}% — you keep <strong>{100 - currentRate}%</strong> of each sale (before Stripe's ~2.9% + 30¢ processing fee).
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountSettings() {
  const { isChecking } = useAuthCheck();
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    username: "",
    displayName: "",
    email: "",
    saving: false
  });
  
  // Social links state
  const [socialLinks, setSocialLinks] = useState<SocialLinkDraft[]>([]);
  const [socialLinksSaving, setSocialLinksSaving] = useState(false);
  const [socialLinksError, setSocialLinksError] = useState('');

  // Change password dialog state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // MFA Dialog state
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [showTOTPDialog, setShowTOTPDialog] = useState(false);
  const [managingFactor, setManagingFactor] = useState<string | null>(null);
  
  // MFA hooks
  const { factors, hasMFA, fetchFactors, unenrollFactor } = useMFA();
  const { isEnabled: emailMFAEnabled } = useEmailMFA();

  // Notification preferences hook
  const { 
    preferences: notificationSettings,
    isLoading: notificationsLoading,
    isSaving: notificationsSaving,
    updatePreference,
    savePreferences: saveNotifPreferences
  } = useNotificationPreferences();
  
  // Avatar upload state and functionality
  const { getAvatarUrl, uploadAvatar, isCreator } = useUnifiedAvatar();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
        displayName: (profile as any).display_name || "",
        email: user?.email || "",
        saving: false
      });
    }
  }, [profile, user]);

  // Load current social links from users table
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .select('social_links')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const links = (data?.social_links as SocialLinkDraft[]) ?? [];
        setSocialLinks(links.length > 0 ? links : []);
      });
  }, [user?.id]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountSettings(prev => ({ ...prev, [name]: value }));
  };
  const handleNotificationChange = (
    key: 'emailNotifications' | 'newContentAlerts' | 'commentReplies',
    value: boolean
  ) => {
    updatePreference(key, value);
  };

  // TOTP MFA handlers
  const handleTOTPEnrollmentComplete = () => {
    setShowTOTPDialog(false);
    fetchFactors();
    toast({
      title: "MFA Enabled",
      description: "Two-factor authentication has been successfully enabled for your account.",
    });
  };

  const handleTOTPEnrollmentCancel = () => {
    setShowTOTPDialog(false);
  };

  const handleUnenrollFactor = async (factorId: string) => {
    try {
      await unenrollFactor(factorId);
      setManagingFactor(null);
      fetchFactors();
      toast({
        title: "MFA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable MFA",
        variant: "destructive",
      });
    }
  };

  // Avatar upload handlers
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    const result = await uploadAvatar(file);
    setUploadingAvatar(false);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      
      // Update username and/or display name
      const usernameChanged = profile?.username !== accountSettings.username;
      const displayNameChanged = (profile as any)?.display_name !== accountSettings.displayName;
      if (usernameChanged || displayNameChanged) {
        await updateProfile({
          username: accountSettings.username,
          display_name: accountSettings.displayName,
        } as any);
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
    } finally {
      setAccountSettings(prev => ({ ...prev, saving: false }));
    }
  };

  const saveSocialLinks = async () => {
    setSocialLinksError('');
    setSocialLinksSaving(true);
    try {
      const normalized: SocialLinkDraft[] = [];
      for (let i = 0; i < socialLinks.length; i++) {
        const link = socialLinks[i];
        const rawUrl = link.url.trim();
        if (!rawUrl && !link.label.trim()) continue;
        const url = normalizeSocialUrl(rawUrl);
        if (!url) {
          setSocialLinksError(`Link #${i + 1} has an invalid URL.`);
          return;
        }
        normalized.push({ label: link.label.trim().slice(0, 60), url });
      }
      const { error } = await supabase
        .from('users')
        .update({ social_links: normalized })
        .eq('id', user!.id);
      if (error) throw error;
      setSocialLinks(normalized);
      toast({ title: 'Social links saved' });
    } catch (err: any) {
      toast({ title: 'Error saving links', description: err.message, variant: 'destructive' });
    } finally {
      setSocialLinksSaving(false);
    }
  };

  const handleChangePassword = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      // Verify current password first before allowing change
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: values.currentPassword,
      });

      if (signInError) {
        toast({
          title: "Incorrect current password",
          description: "The current password you entered is wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });

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
    saveNotifPreferences(notificationSettings);
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
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>
          <div className="mt-6 space-y-6">
            <TabsContent value="account" className="m-0">
              <div className="space-y-6">
                {/* Avatar Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                    <CardDescription>
                      Upload and manage your avatar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24 border-2 border-muted">
                        <AvatarImage 
                          src={getAvatarUrl(profile) || ""} 
                          alt="Profile picture" 
                        />
                        <AvatarFallback className="text-xl">
                          {profile?.username?.substring(0, 1).toUpperCase() || user?.email?.substring(0, 1).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="flex items-center gap-2"
                      >
                        <Camera className={`h-4 w-4 ${uploadingAvatar ? 'animate-spin' : ''}`} />
                        {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={accountSettings.displayName}
                      onChange={handleAccountChange}
                      placeholder="Your name shown on the site"
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown on your profile and asset listings
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={accountSettings.username}
                      onChange={handleAccountChange}
                      placeholder="Enter your username"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your unique URL: fanrealms.com/{accountSettings.username || "username"}
                    </p>
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

                {/* Social Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                    <CardDescription>
                      Links shown on your public profile — website, Twitter, YouTube, etc.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SocialLinksEditor
                      links={socialLinks}
                      onChange={(next) => {
                        setSocialLinks(next);
                        setSocialLinksError('');
                      }}
                      disabled={socialLinksSaving}
                    />
                    {socialLinksError && (
                      <p className="text-sm text-destructive mt-2">{socialLinksError}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={saveSocialLinks} disabled={socialLinksSaving}>
                      {socialLinksSaving ? 'Saving…' : 'Save links'}
                    </Button>
                  </CardFooter>
                </Card>

               </div>
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
                        Receive notifications from content update via email
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
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={saveNotificationSettings} 
                    disabled={notificationsSaving}
                  >
                    {notificationsSaving ? "Saving..." : "Save Preferences"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="m-0">
              <div className="space-y-6">{/* Security Tab Content */}
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
                      <div className="flex items-center gap-3">
                        <Mail className={`h-5 w-5 ${emailMFAEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">Email Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">
                            Receive verification codes via email when signing in
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={emailMFAEnabled ? 'default' : 'secondary'}>
                          {emailMFAEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowMFADialog(true)}
                          >
                            {emailMFAEnabled ? 'Manage' : 'Set up'}
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                          <DialogContent className="max-w-md">
                            <EmailMFASetup />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className={`h-5 w-5 ${hasMFA ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <p className="font-medium">Authenticator App (TOTP)</p>
                          <p className="text-sm text-muted-foreground">
                            Use an authenticator app to generate secure verification codes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={hasMFA ? 'default' : 'secondary'}>
                          {hasMFA ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {hasMFA ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setManagingFactor(factors[0]?.id || null)}
                          >
                            Manage
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        ) : (
                          <Dialog open={showTOTPDialog} onOpenChange={setShowTOTPDialog}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setShowTOTPDialog(true)}
                            >
                              Set up
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                            <DialogContent className="max-w-md">
                              <MFAEnrollment 
                                onEnrollmentComplete={handleTOTPEnrollmentComplete}
                                onCancel={handleTOTPEnrollmentCancel}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-6 mt-6">
              <PayoutsTab />
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

        {/* Email MFA Setup Dialog */}
        <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
          <DialogContent className="max-w-md">
            <EmailMFASetup />
          </DialogContent>
        </Dialog>

        {/* MFA Management Dialog */}
        <Dialog open={!!managingFactor} onOpenChange={() => setManagingFactor(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                You can disable two-factor authentication for your account below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-sm text-muted-foreground">
                    Currently protecting your account
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Disabling 2FA will make your account less secure. Make sure you have alternative security measures in place.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManagingFactor(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => managingFactor && handleUnenrollFactor(managingFactor)}
              >
                <X className="h-4 w-4 mr-1" />
                Disable 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </>
  );
}
