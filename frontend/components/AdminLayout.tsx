'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { useEffect } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Star,
  Calendar,
  Coins,
  Flag,
  LogOut,
  Shield,
  ArrowLeft,
  Award
} from 'lucide-react'

interface AdminLayoutProps {
  children: ReactNode
}

const sidebarItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Intents', href: '/admin/intents', icon: Briefcase },
  { name: 'Tribes', href: '/admin/tribes', icon: Star },
  { name: 'Sessions', href: '/admin/sessions', icon: Calendar },
  { name: 'Credits', href: '/admin/credits', icon: Coins },
  { name: 'Achievements', href: '/admin/achievements', icon: Award },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading, isAuthenticated, viewMode, setViewMode } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Protect admin route
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    } else if (!loading && isAuthenticated && !isAdmin) {
      router.push('/dashboard')
    }
  }, [loading, isAuthenticated, isAdmin, router])

  // Show loading or nothing while checking auth
  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-accent)]"></div>
          <p className="text-[var(--color-accent)] mt-4 font-serif italic text-xl">Checking permissions...</p>
        </div>
      </div>
    )
  }

  const switchToUserView = () => {
    setViewMode('user')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] fixed h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-serif font-black text-lg">Collixa</h1>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-accent)] font-bold">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            // Dashboard should only be active on exact /admin, not subpages
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[var(--color-border)] space-y-2">
          <button
            onClick={switchToUserView}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <ArrowLeft size={18} />
            View as User
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-black uppercase tracking-wider rounded-full">
              Admin Mode
            </span>
          </div>
          <ThemeToggle />
        </div>

        {children}
      </main>
    </div>
  )
}
