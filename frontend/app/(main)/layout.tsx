'use client'

import React from 'react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * (main) Layout
 * This layout is shared across all authenticated/community pages
 * to ensure persistent UI elements (Sidebar, Header) do not unmount
 * during navigation.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Centralized authentication check
  useEffect(() => {
    console.log(`[MainLayout] Auth Check - Loading: ${loading}, Auth: ${isAuthenticated}`);
    if (!loading && !isAuthenticated) {
      console.warn('[MainLayout] Unauthorized access detected, redirecting to /auth');
      router.push('/auth')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-accent)]"></div>
          <p className="text-[var(--color-accent)] mt-4 font-serif italic text-xl">Connecting to Hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen transition-colors duration-700 font-sans flex flex-col overflow-hidden">
      <Header />
      
      {/* 
        Persistent Layout Container
        - Consistent max-width (1536px) to prevent horizontal "jumping"
        - Relative positioning for fixed Sidebar alignment
      */}
      <div className="flex flex-1 max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-12 pb-4 md:pb-8 pt-20 gap-8 relative overflow-hidden">
        
        {/* Sidebar - Mounted once and shared across all (main) routes */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile-only Bottom Navigation */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
