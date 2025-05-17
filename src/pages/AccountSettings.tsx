
import { MainLayout } from "@/components/Layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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

export default function AccountSettings() {
  const { signOut, profile } = useAuth();
  
  return (
    <MainLayout>
      <div className="container py-6 space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-gray-400">Manage your account preferences and settings</p>
          </div>
          <Button variant="destructive" className="flex items-center gap-2" onClick={signOut}>
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
                        {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "JD"}
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
                        <Input id="displayName" defaultValue={profile?.full_name || "John Doe"} className="bg-gray-800 border-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" defaultValue={profile?.username || "johndoe"} className="bg-gray-800 border-gray-700" />
                        <p className="text-xs text-gray-400">fanrealms.com/{profile?.username || "johndoe"}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={profile?.email || "john.doe@example.com"}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        rows={4}
                        className="w-full rounded-md bg-gray-800 border border-gray-700 p-3 text-white"
                        defaultValue={profile?.bio || "Digital creator passionate about art and technology. Sharing my creative journey and exclusive content with my supporters."}
                      />
                      <p className="text-xs text-gray-400">
                        Brief description for your profile. Maximum 160 characters.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-500" />
                        Facebook
                      </Label>
                      <Input defaultValue="https://facebook.com/johndoe" className="bg-gray-800 border-gray-700" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Twitter className="h-4 w-4 text-blue-400" />
                        Twitter
                      </Label>
                      <Input defaultValue="https://twitter.com/johndoe" className="bg-gray-800 border-gray-700" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Instagram
                      </Label>
                      <Input defaultValue="https://instagram.com/johndoe" className="bg-gray-800 border-gray-700" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        YouTube
                      </Label>
                      <Input defaultValue="https://youtube.com/johndoe" className="bg-gray-800 border-gray-700" />
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
                <CardTitle>Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" className="bg-gray-800 border-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" className="bg-gray-800 border-gray-700" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
                <div>
                  <p className="text-sm text-gray-400">Last password change: 3 months ago</p>
                </div>
                <Button>Update Password</Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-400">Secure your account with 2FA</p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Authenticator App</p>
                      <p className="text-sm text-gray-400">Use an authenticator app</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Setup
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Email Authentication</p>
                      <p className="text-sm text-gray-400">Receive codes via email</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Setup
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage devices where you're currently logged in</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-900/30 p-2 rounded-full">
                        <Smartphone className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">iPhone 13 Pro • iOS 16</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">
                            Current Device
                          </Badge>
                          <p className="text-xs text-gray-400">New York, USA • Last active now</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-400">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-900/30 p-2 rounded-full">
                        <Globe className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">Chrome • Windows 11</p>
                        <p className="text-xs text-gray-400">London, UK • Last active 2 days ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-400">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-900/30 p-2 rounded-full">
                        <Globe className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">Firefox • macOS</p>
                        <p className="text-xs text-gray-400">San Francisco, USA • Last active 1 week ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-400">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-800 pt-4">
                <Button variant="outline" className="text-red-400 border-red-400/20 hover:bg-red-400/10">
                  Sign Out All Devices
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">New Messages</p>
                          <p className="text-sm text-gray-400">Get notified when you receive a message</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">New Subscribers</p>
                          <p className="text-sm text-gray-400">Get notified when someone subscribes to your content</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Payment Updates</p>
                          <p className="text-sm text-gray-400">Get notified about payment confirmations and issues</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Platform Updates</p>
                          <p className="text-sm text-gray-400">Get notified about new features and updates</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">In-App Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Messages</p>
                          <p className="text-sm text-gray-400">Show notifications for new messages</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BellRing className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Mentions</p>
                          <p className="text-sm text-gray-400">Show notifications when you're mentioned</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">New Subscribers</p>
                          <p className="text-sm text-gray-400">Show notifications for new subscribers</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Do Not Disturb</p>
                          <p className="text-sm text-gray-400">Pause all notifications during specified hours</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From</Label>
                        <Input type="time" defaultValue="22:00" className="bg-gray-800 border-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <Label>To</Label>
                        <Input type="time" defaultValue="07:00" className="bg-gray-800 border-gray-700" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Reset to Default</Button>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy and visibility on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Profile Visibility</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Public Profile</p>
                          <p className="text-sm text-gray-400">Allow anyone to view your profile</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Show Online Status</p>
                          <p className="text-sm text-gray-400">Let others see when you're online</p>
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Direct Messages</p>
                          <p className="text-sm text-gray-400">Who can send you direct messages</p>
                        </div>
                      </div>
                      <select className="bg-gray-800 border-gray-700 rounded-md p-2 text-sm">
                        <option>Everyone</option>
                        <option>Subscribers Only</option>
                        <option>No One</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Content Privacy</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Default Post Privacy</p>
                          <p className="text-sm text-gray-400">Set the default privacy level for your posts</p>
                        </div>
                      </div>
                      <select className="bg-gray-800 border-gray-700 rounded-md p-2 text-sm">
                        <option>Public</option>
                        <option>Subscribers Only</option>
                        <option>Specific Tiers</option>
                      </select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Blocked Accounts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg?height=40&width=40" />
                          <AvatarFallback className="bg-red-900">JD</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Jane Smith</p>
                          <p className="text-xs text-gray-400">Blocked 2 weeks ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Unblock
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg?height=40&width=40" />
                          <AvatarFallback className="bg-blue-900">RJ</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">Robert Johnson</p>
                          <p className="text-xs text-gray-400">Blocked 1 month ago</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Unblock
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button>Save Privacy Settings</Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Data & Personalization</CardTitle>
                <CardDescription>Manage your data and how it's used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">Download Your Data</p>
                      <p className="text-sm text-gray-400">Get a copy of your data on FanRealms</p>
                    </div>
                  </div>
                  <Button variant="outline">Request Data</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods and billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-900/30 p-2 rounded-full">
                        <CreditCard className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">
                            Default
                          </Badge>
                          <p className="text-xs text-gray-400">Expires 12/2025</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
                <CardDescription>Manage your billing address for invoices and receipts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="John" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address1">Address Line 1</Label>
                    <Input id="address1" defaultValue="123 Main St" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input id="address2" defaultValue="Apt 4B" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue="New York" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" defaultValue="NY" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP/Postal Code</Label>
                    <Input id="zip" defaultValue="10001" className="bg-gray-800 border-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <select id="country" className="w-full bg-gray-800 border border-gray-700 rounded-md p-2">
                      <option>United States</option>
                      <option>Canada</option>
                      <option>United Kingdom</option>
                      <option>Australia</option>
                      <option>Germany</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Cancel</Button>
                <Button>Save Address</Button>
              </CardFooter>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View and download your past invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Premium Subscription</p>
                      <p className="text-sm text-gray-400">May 1, 2023</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">$19.99</p>
                      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Paid</Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Premium Subscription</p>
                      <p className="text-sm text-gray-400">April 1, 2023</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">$19.99</p>
                      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Paid</Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">Premium Subscription</p>
                      <p className="text-sm text-gray-400">March 1, 2023</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">$19.99</p>
                      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Paid</Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>Customize the appearance of your FanRealms experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Color Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-black border-2 border-purple-500 rounded-lg p-4 w-full h-24 flex items-center justify-center">
                        <Check className="h-6 w-6 text-purple-500" />
                      </div>
                      <p className="text-sm font-medium">Dark (Default)</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-white border border-gray-300 rounded-lg p-4 w-full h-24 flex items-center justify-center">
                        <div className="text-black">Light</div>
                      </div>
                      <p className="text-sm font-medium">Light</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 w-full h-24 flex items-center justify-center">
                        <div>System</div>
                      </div>
                      <p className="text-sm font-medium">System</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Accent Color</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-purple-500 rounded-full w-10 h-10 flex items-center justify-center border-2 border-white">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-medium">Purple</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-blue-500 rounded-full w-10 h-10"></div>
                      <p className="text-sm font-medium">Blue</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-green-500 rounded-full w-10 h-10"></div>
                      <p className="text-sm font-medium">Green</p>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-pink-500 rounded-full w-10 h-10"></div>
                      <p className="text-sm font-medium">Pink</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Font Size</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">A</p>
                      <input type="range" min="1" max="5" defaultValue="3" className="w-full mx-4 accent-purple-500" />
                      <p className="text-lg">A</p>
                    </div>
                    <p className="text-sm text-gray-400">Adjust the font size for better readability</p>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Accessibility</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Reduce Motion</p>
                        <p className="text-sm text-gray-400">Minimize animations throughout the interface</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">High Contrast</p>
                        <p className="text-sm text-gray-400">Increase contrast for better visibility</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-gray-800 pt-4">
                <Button variant="ghost">Reset to Default</Button>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
