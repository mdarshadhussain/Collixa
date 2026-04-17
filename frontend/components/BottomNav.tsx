'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, MessageSquare, Briefcase, User } from 'lucide-react'

const BottomNav = () => {
  const pathname = usePathname()

  const navItems = [
    { name: 'Hub', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Intents', href: '/collaborations', icon: Briefcase },
    { name: 'Tribes', href: '/skills', icon: Users },
    { name: 'Messages', href: '/chat', icon: MessageSquare },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)] px-4 py-2 flex justify-around items-center md:hidden z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-[var(--color-accent-soft)] scale-110' : ''
            }`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default BottomNav
