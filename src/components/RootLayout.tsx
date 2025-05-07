
import type React from "react"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/sidebar/sidebar"
import { useLocation } from "react-router-dom"
import { CreatorStudioSidebar } from "@/components/ui/sidebar/creator-studio-sidebar"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCreatorStudioRoute = location.pathname.startsWith('/creator-studio');

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SidebarProvider>
        <div className="flex min-h-screen">
          {/* Conditionally render the appropriate sidebar based on the route */}
          {isCreatorStudioRoute ? (
            <CreatorStudioSidebar />
          ) : (
            <AppSidebar />
          )}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  )
}
