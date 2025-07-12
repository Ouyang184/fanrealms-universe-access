
import { useAuthCheck } from "@/lib/hooks/useAuthCheck";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { AgeVerificationModal } from "@/components/nsfw/AgeVerificationModal";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { ContentPreferencesTab } from "@/components/settings/ContentPreferencesTab";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Settings() {
  const { isChecking, user } = useAuthCheck();
  const isMobile = useIsMobile();
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
              <TabsList className={isMobile ? "grid grid-cols-5 h-auto p-1 w-full" : ""}>
                <TabsTrigger value="profile" className={isMobile ? "text-[10px] px-1 py-2 min-w-0" : ""}>
                  {isMobile ? "Profile" : "Profile"}
                </TabsTrigger>
                <TabsTrigger value="account" className={isMobile ? "text-[10px] px-1 py-2 min-w-0" : ""}>
                  {isMobile ? "Account" : "Account"}
                </TabsTrigger>
                <TabsTrigger value="notifications" className={isMobile ? "text-[10px] px-1 py-2 min-w-0" : ""}>
                  {isMobile ? "Alerts" : "Notifications"}
                </TabsTrigger>
                <TabsTrigger value="privacy" className={isMobile ? "text-[10px] px-1 py-2 min-w-0" : ""}>
                  {isMobile ? "Privacy" : "Privacy"}
                </TabsTrigger>
                <TabsTrigger value="content" className={isMobile ? "text-[10px] px-1 py-2 min-w-0" : ""}>
                  {isMobile ? "Content" : "Content"}
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
