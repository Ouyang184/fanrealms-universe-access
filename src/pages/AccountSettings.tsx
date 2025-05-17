import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Lock,
  Bell,
  Eye,
  CreditCard,
  Globe,
  Palette,
  Smartphone,
  LogOut,
  Upload,
  Shield,
  Clock,
  UserPlus,
  Mail,
  MessageSquare,
  BellRing,
  Download,
  Trash2,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AccountSettings() {
  const { isChecking } = useAuthCheck();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
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
    <MainLayout>
      <div className="container py-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-gray-400">Manage your account preferences and settings</p>
          </div>
          <Button variant="destructive" className="flex items-center gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-gray-900 p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile details and public information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={profile?.profile_picture || "/placeholder.svg?height=128&width=128"} />
                      <AvatarFallback className="bg-purple-900 text-2xl">
                        {profile?.username?.substring(0, 2).toUpperCase() || "JD"}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Change Photo
                    </Button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input 
                          id="displayName" 
                          defaultValue={profile?.full_name || ""} 
                          className="bg-gray-800 border-gray-700" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          defaultValue={profile?.username || ""} 
                          className="bg-gray-800 border-gray-700" 
                        />
                        <p className="text-xs text-gray-400">fanrealms.com/{profile?.username || "username"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={profile?.email || ""}
                        className="bg-gray-800 border-gray-700"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        rows={4}
                        className="w-full rounded-md bg-gray-800 border border-gray-700 p-3 text-white"
                        defaultValue={profile?.bio || ""}
                      />
                      <p className="text-xs text-gray-400">
                        Brief description for your profile. Maximum 160 characters.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6 bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Social Links</h3>
                  <p className="text-gray-400">Add links to your social media profiles</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          id="facebook"
                          placeholder="https://facebook.com/yourprofile"
                          className="bg-gray-800 border-gray-700 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          id="twitter"
                          placeholder="https://twitter.com/yourprofile"
                          className="bg-gray-800 border-gray-700 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          id="instagram"
                          placeholder="https://instagram.com/yourprofile"
                          className="bg-gray-800 border-gray-700 pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <div className="relative">
                        <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          id="youtube"
                          placeholder="https://youtube.com/yourchannel"
                          className="bg-gray-800 border-gray-700 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security and password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Change Password</h3>
                  <p className="text-gray-400">Update your account password for enhanced security</p>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>

                <Separator className="my-6 bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Two-Factor Authentication</h3>
                  <p className="text-gray-400">
                    Add an extra layer of security to your account with two-factor authentication
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-400">
                        Receive a verification code on your device when you log in
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Customize the notifications you receive and how you receive them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Email Notifications</h3>
                  <p className="text-gray-400">Control which notifications you receive via email</p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>New Content and Updates</Label>
                      <p className="text-sm text-gray-400">
                        Receive notifications about new content and platform updates
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Account Activity</Label>
                      <p className="text-sm text-gray-400">
                        Get notified about important account activities and security alerts
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator className="my-6 bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">In-App Notifications</h3>
                  <p className="text-gray-400">Manage the notifications you see within the application</p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>New Messages</Label>
                      <p className="text-sm text-gray-400">
                        Get notified when you receive new messages from other users
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Likes and Comments</Label>
                      <p className="text-sm text-gray-400">
                        Receive notifications when your content gets liked or commented on
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy preferences and data settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Profile Visibility</h3>
                  <p className="text-gray-400">Manage who can see your profile and content</p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Public Profile</Label>
                      <p className="text-sm text-gray-400">
                        Make your profile visible to everyone on the platform
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Search Engine Indexing</Label>
                      <p className="text-sm text-gray-400">
                        Allow search engines to index your profile and content
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator className="my-6 bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Data Settings</h3>
                  <p className="text-gray-400">Manage your data and how it's used on the platform</p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Personalized Ads</Label>
                      <p className="text-sm text-gray-400">
                        Allow us to use your data to show you personalized ads
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Data Collection</Label>
                      <p className="text-sm text-gray-400">
                        Allow us to collect and use your data to improve the platform
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Manage your billing details and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Payment Method</h3>
                  <p className="text-gray-400">Update your payment method for subscriptions and purchases</p>

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="Enter card number"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="text"
                        placeholder="CVV"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6 bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Billing Address</h3>
                  <p className="text-gray-400">Update your billing address for invoices and receipts</p>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter address"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Enter city"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="Enter zip code"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize the look and feel of your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Theme</h3>
                  <p className="text-gray-400">Choose your preferred theme for the platform</p>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-gray-400">
                        Enable dark mode for a more comfortable viewing experience
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator className="my-6 bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Language</h3>
                  <p className="text-gray-400">Choose your preferred language for the platform</p>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      type="text"
                      placeholder="Select language"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
