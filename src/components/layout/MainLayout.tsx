
import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/Layout/TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Footer from '@/components/Layout/Footer';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface MainLayoutProps {
  children: ReactNode;
  showTabs?: boolean;
  hideTopBar?: boolean;
}

export function MainLayout({ children, showTabs = false, hideTopBar = false }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>("feed");
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      {!hideTopBar && (
        <TopBar>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </TopBar>
      )}
      <div className="flex-1 px-4 md:px-6 py-6 overflow-y-auto">
        {showTabs ? (
          <div className="max-w-6xl mx-auto w-full">
            <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b mb-6">
                <TabsList className="justify-start">
                  <TabsTrigger value="feed">Feed</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="feed" className="pt-4">{children}</TabsContent>
              <TabsContent value="notifications" className="pt-4">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Notifications</h2>
                  <div className="text-muted-foreground">
                    You don't have any notifications yet.
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        )}
      </div>
      {/* Only render footer if user is not authenticated */}
      {!user && <Footer />}
    </div>
  );
}
