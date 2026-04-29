import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/app/context/AuthContext"
import { ToastProvider } from "@/app/context/ToastContext"
import { ToastContainer } from "@/components/ToastContainer"
import { ThemeProvider } from "@/components/ThemeProvider"

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && (String(event.reason.message).includes('MetaMask') || String(event.reason.stack).includes('MetaMask'))) {
                  event.preventDefault();
                }
              });
              window.addEventListener('error', function(event) {
                if (String(event.message).includes('MetaMask') || String(event.filename).includes('nkbihfbeogaeaoehlefnkodbefgpgknn')) {
                  event.preventDefault();
                }
              });
            `
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
