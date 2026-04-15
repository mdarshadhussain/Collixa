import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/app/context/AuthContext"
import { ToastProvider } from "@/app/context/ToastContext"
import { ToastContainer } from "@/components/ToastContainer"

export const metadata: Metadata = {
  title: "Collixa - Skill & Intent Marketplace",
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
        <AuthProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
