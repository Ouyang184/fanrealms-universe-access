
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileInfoForm } from "@/components/creator-studio/settings/ProfileInfoForm";
import { BannerSection } from "@/components/creator-studio/settings/BannerSection";
import { SocialLinksSection } from "@/components/creator-studio/settings/SocialLinksSection";
import { StripeConnectSection } from "@/components/creator-studio/StripeConnectSection";

export default function CreatorStudioSettings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Creator Settings</h1>
        <p className="text-muted-foreground">Manage your creator profile and account settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileInfoForm />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <StripeConnectSection />
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <SocialLinksSection />
        </TabsContent>

        <TabsContent value="banner" className="space-y-6">
          <BannerSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
