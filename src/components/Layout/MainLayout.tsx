
import { ReactNode, useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MainLayoutProps {
  children: ReactNode;
  showTabs?: boolean;
  hideTopBar?: boolean; // Add this prop to control TopBar visibility
}

export function MainLayout({ children, showTabs = false, hideTopBar = false }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState<string>("feed");
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-h-screen">
          {!hideTopBar && <TopBar />}
          <main className="flex-1 px-4 md:px-6 pb-8 overflow-y-auto">
            {showTabs ? (
              <div className="max-w-5xl mx-auto w-full">
                <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="border-b mb-6">
                    <TabsList className="justify-start">
                      <TabsTrigger value="feed">Feed</TabsTrigger>
                      <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="feed">{children}</TabsContent>
                  <TabsContent value="notifications">
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
              <div className="max-w-5xl mx-auto w-full">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
