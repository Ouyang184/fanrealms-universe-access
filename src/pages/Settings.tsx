
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentPreferencesTab } from '@/components/settings/ContentPreferencesTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAgeVerification } from '@/hooks/useAgeVerification';
import { AgeVerificationModal } from '@/components/nsfw/AgeVerificationModal';

// Simple inline component to avoid prop issues
interface NotificationPreferencesProps {
  // No props needed for now
}

const NotificationPreferences = ({}: NotificationPreferencesProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Configure your notification settings
        </p>
      </div>
      {/* Notification settings content would go here */}
    </div>
  );
};

export default function SettingsPage() {
  const { user } = useAuth();
  const {
    isVerified,
    isLoading,
    verifyAge
  } = useAgeVerification();

  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    document.title = "Settings | FanRealms";
  }, []);

  const handleAgeVerified = () => {
    setShowVerificationModal(false);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-2xl font-semibold mb-4">Please sign in</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to access settings.
            </p>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content Preferences</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <ContentPreferences />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationPreferences />
          </TabsContent>
        </Tabs>

        {/* Age Verification Modal */}
        <AgeVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onVerified={handleAgeVerified}
        />
      </div>
    </MainLayout>
  );
}

// Simple inline ContentPreferences component to avoid prop issues
const ContentPreferences = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Content Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Configure what content you want to see
        </p>
      </div>
      <ContentPreferencesTab />
    </div>
  );
};
