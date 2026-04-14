'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, MessageSquare, Briefcase } from 'lucide-react'

const BottomNav = () => {
  const pathname = usePathname()

  const navItems = [
    { name: 'Hub', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Collaborations', href: '/collaborations', icon: Briefcase },
    { name: 'Tribes', href: '/skills', icon: Users },
    { name: 'Messages', href: '/chat', icon: MessageSquare },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex justify-between items-center md:hidden z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${
              isActive ? 'bg-primary/10 scale-110' : ''
            }`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export default BottomNav
