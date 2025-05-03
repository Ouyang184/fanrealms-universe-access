
import type React from "react"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  )
}
