
import type React from "react"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 flex justify-center">
          <div className="max-w-7xl w-full">
            {children}
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
