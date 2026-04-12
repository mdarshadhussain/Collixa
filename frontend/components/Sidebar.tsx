'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, MessageSquare, Users, Settings, PlusCircle } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Projects', href: '/dashboard' },
  { icon: FileText, label: 'My Projects', href: '/my-intents' },
  { icon: MessageSquare, label: 'Messages', href: '/chat' },
  { icon: Users, label: 'Tribes', href: '/skills' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-72 border border-[var(--color-border)] hidden lg:flex flex-col p-8 rounded-[2.5rem] sticky top-28 h-full bg-[var(--color-bg-secondary)]/50 backdrop-blur-md shadow-xl shadow-black/5">
      <div className="flex flex-col h-full">
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
                      ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-lg shadow-[var(--color-accent)]/20'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-soft)]'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto">
          <div className="pt-8 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-4 px-4">
               <div className="w-10 h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-serif font-black">C.</div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-primary)]">Collixa Pro</p>
                 <p className="text-[8px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter">Unlimited Projects</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
