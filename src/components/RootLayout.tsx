
import type React from "react"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieConsent } from "@/components/CookieConsent"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen">
        {children}
        <CookieConsent />
      </div>
    </ThemeProvider>
  )
}
