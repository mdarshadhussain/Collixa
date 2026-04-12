import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/app/context/AuthContext"
import { ThemeProvider } from "@/app/context/ThemeContext"

export const metadata: Metadata = {
  title: "Collixa - Skill & Collaboration Marketplace",
  description: "Find your people, build together. A modern skill and collaboration marketplace.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
