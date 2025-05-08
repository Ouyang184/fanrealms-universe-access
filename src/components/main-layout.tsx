
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  showTabs?: boolean;
  hideTopBar?: boolean;
}

export function MainLayout({ children, showTabs = false, hideTopBar = false }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground">
        {/* Sidebar */}
        <Sidebar 
          sidebarCollapsed={sidebarCollapsed} 
          setSidebarCollapsed={setSidebarCollapsed} 
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Only show if hideTopBar is false */}
          {!hideTopBar && <Header />}

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
