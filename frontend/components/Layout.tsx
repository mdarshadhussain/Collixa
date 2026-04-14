'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
  showSidebar?: boolean
  requireAuth?: boolean
}

export default function Layout({ 
  children, 
  showHeader = true, 
  showSidebar = true,
  requireAuth = true
}: LayoutProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && !loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [requireAuth, loading, isAuthenticated, router])

  if (requireAuth && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-accent)]"></div>
          <p className="text-[var(--color-accent)] mt-4 font-serif italic text-xl">Entering Collixa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col font-sans transition-colors duration-700">
      {showHeader && <Header />}
      
      <div className="flex flex-1 max-w-[1700px] mx-auto w-full px-6 sm:px-10 md:px-16 py-6 md:py-12 gap-6 md:gap-12 relative">
        {showSidebar && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}
        
        <main className="flex-1 pb-24 md:pb-0 overflow-y-auto">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
