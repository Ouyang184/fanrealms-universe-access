
import type React from "react"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { useLocation } from "react-router-dom"
import { AppSidebar } from "@/components/Layout/AppSidebar"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "./Layout/TopBar"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  
  // Check if we're on the landing page or auth pages where we don't want the app layout
  const isPublicPage = 
    location.pathname === "/" || 
    location.pathname === "/login" || 
    location.pathname === "/signup" || 
    location.pathname === "/auth/callback" ||
    location.pathname.includes("/onboarding");

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen">
        {user && !isPublicPage ? (
          <div className="flex h-screen">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </ThemeProvider>
  )
}
