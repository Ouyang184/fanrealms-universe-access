
import type React from "react"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/Layout/AppSidebar"
import { TopBar } from "@/components/Layout/TopBar"
import { useAuth } from "@/contexts/AuthContext"
import { useLocation } from "react-router-dom"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  
  // Determine if current page needs sidebar
  const isAuthPage = ['/login', '/signup', '/onboarding', '/auth/callback'].includes(location.pathname)
  const isLandingPage = location.pathname === '/'
  
  // Only show navigation for authenticated users and on appropriate pages
  const showNavigation = user && !isAuthPage && !isLandingPage

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex">
        {showNavigation && <AppSidebar />}
        <div className="flex-1 flex flex-col min-h-screen">
          {showNavigation && <TopBar />}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
