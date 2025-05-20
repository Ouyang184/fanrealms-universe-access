
import { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar/Sidebar";
import { Header } from "./Header/Header";
import { useLocation } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  
  // Don't show the main layout on auth pages or landing page
  const isAuthPage = location.pathname === '/login' || 
                    location.pathname === '/signup' || 
                    location.pathname === '/auth/callback' ||
                    location.pathname === '/onboarding' ||
                    location.pathname === '/logout' ||
                    location.pathname === '/logout/loading';
                    
  const isLandingPage = location.pathname === '/' || location.pathname === '/index';
                    
  if (isAuthPage || isLandingPage) {
    return <>{children}</>;
  }
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        onSignOut={signOut} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          profile={profile} 
          onSignOut={signOut} 
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
