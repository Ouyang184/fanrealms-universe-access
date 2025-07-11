
import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar/Sidebar";
import { Header } from "./Header/Header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar 
        collapsed={isMobile ? true : sidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        onSignOut={signOut} 
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
