'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, MessageSquare, Users, User, Zap, Award } from 'lucide-react'
import { messageService, supabase } from '@/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { icon: LayoutDashboard, label: 'Hub', href: '/dashboard' },
  { icon: FileText, label: 'Intent', href: '/collaborations' },
  { icon: MessageSquare, label: 'Messages', href: '/chat' },
  { icon: Users, label: 'Tribes', href: '/skills' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Award, label: 'Achievements', href: '/rewards' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    if (!isAuthenticated) return

    const fetchUnread = async () => {
      const count = await messageService.getUnreadCount()
      setUnreadCount(count)
    }

    fetchUnread()

    // Real-time subscription for unread counts
    const channel = supabase
      .channel('public:unread_counts')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        // Re-fetch count when any message is inserted or updated
        fetchUnread()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated])

  return (
    <>
    <div className="hidden lg:block w-72 shrink-0" />
    <aside className="w-72 border border-[var(--color-border)] hidden lg:flex flex-col p-8 rounded-[2.5rem] fixed top-28 h-[calc(100vh-8rem)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-md shadow-xl shadow-black/5 overflow-y-auto">
      <div className="flex flex-col min-h-full">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-8 ml-4 opacity-60">Menu</p>
          <nav className="space-y-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20 shadow-xl'
                      : 'text-[var(--color-text-primary)] opacity-60 hover:opacity-100 hover:bg-[var(--color-accent-soft)]/20'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100 transition-opacity'} />
                  <span className={`text-[11px] font-black uppercase tracking-[0.2em] flex-1 ${isActive ? '' : 'text-[var(--color-text-primary)] opacity-70'}`}>{item.label}</span>
                  {item.label === 'Messages' && unreadCount > 0 && (
                    <span className="px-2 py-0.5 min-w-[1.5rem] text-center text-[9px] font-black bg-[var(--color-bg-secondary)] text-[var(--color-accent)] rounded-full shadow-sm ring-2 ring-[var(--color-accent)]/20 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="pt-8 border-t border-[var(--color-border)]">
            <div className="flex items-center justify-between px-4 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">Appearance</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center gap-4 px-4">
               <div className="w-10 h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-serif font-black">C.</div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-primary)]">Collixa Pro</p>
                 <p className="text-[8px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter">Unlimited Intents</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    </>
  )
}
