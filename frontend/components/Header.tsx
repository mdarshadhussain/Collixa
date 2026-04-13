'use client'

import Link from 'next/link'
import { Menu, X, ChevronDown, Sun, Moon, Zap, MessageSquare, Plus, LayoutDashboard, FileText, Users, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import Avatar from './Avatar'
import NotificationDropdown from './NotificationDropdown'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import { useRouter } from 'next/navigation'
import { storageService } from '@/lib/supabase'
import CreditPurchaseModal from './CreditPurchaseModal'

export default function Header() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const mainNavItems = [
    { label: 'Marketplace', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Projects', href: '/my-intents', icon: FileText },
    { label: 'Tribes', href: '/skills', icon: Users },
  ]

  return (
    <header className={`sticky top-0 z-[100] w-full transition-all duration-500 ${
      scrolled 
        ? 'bg-[var(--color-bg-primary)] backdrop-blur-2xl bg-opacity-80 border-b border-[var(--color-border)] shadow-sm shadow-black/5' 
        : 'bg-[var(--color-bg-primary)] border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 w-full flex justify-between items-center py-3 md:py-6">
        
        {/* ─── LOGO (EDITORIAL ARCHETYPE) ─── */}
        <Link href="/" className="flex items-center gap-3 sm:gap-6 group">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12">
            <div className="absolute inset-0 bg-[var(--color-accent)] rounded-[1.5rem] rotate-45 transform transition-transform group-hover:rotate-0 duration-700 opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[var(--color-accent)] font-serif text-2xl sm:text-3xl font-black italic">C.</span>
            </div>
          </div>
          <span className="hidden md:block font-serif font-black tracking-[-0.05em] text-3xl text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">Collixa.</span>
        </Link>

        {/* ─── DESKTOP NAVIGATION ─── */}
        <nav className="hidden lg:flex items-center gap-10">
          {mainNavItems.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ─── ACTION CLUSTER ─── */}
        <div className="hidden lg:flex items-center gap-4">
          {isAuthenticated && (
            <div className="px-4 py-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[9px] font-black uppercase tracking-[0.12em] text-[var(--color-accent)]">
              Credits: {user?.credits ?? 0}
            </div>
          )}
          
          {isAuthenticated && (
            <button
              onClick={() => setShowCreditModal(true)}
              className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[9px] font-black uppercase tracking-[0.12em] rounded-full transition-all flex items-center gap-2 hover:opacity-90 active:scale-95 transform"
            >
              <Plus size={12} />
              Get More Credits
            </button>
          )}

          <button 
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-center transition-all bg-[var(--color-bg-secondary)] shadow-sm overflow-hidden group"
          >
            <div className="relative w-6 h-6">
               <Sun className={`absolute inset-0 transition-all duration-1000 ${theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'} text-[var(--color-accent)]`} size={24} />
               <Moon className={`absolute inset-0 transition-all duration-1000 ${theme === 'light' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'} text-[var(--color-text-primary)]`} size={24} />
            </div>
          </button>

          {isAuthenticated && <NotificationDropdown />}

          {isAuthenticated && user ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-5 p-2 pr-6 rounded-[2rem] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] transition-all shadow-sm group"
              >
                <Avatar 
                  name={user.name} 
                  src={user.avatar_url ? storageService.getPublicUrl(user.avatar_url) : undefined} 
                  size="sm" 
                  className="ring-2 ring-offset-2 ring-offset-[var(--color-bg-primary)] ring-[var(--color-accent-soft)]" 
                />
                <div className="text-left">
                  <p className="text-[10px] font-black tracking-tight text-[var(--color-text-primary)]">{user.name.split(' ')[0]}</p>
                </div>
                <ChevronDown size={14} className={`text-[var(--color-text-secondary)] transition-transform duration-500 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-6 w-64 bg-[var(--color-bg-secondary)] rounded-[2.5rem] shadow-2xl border border-[var(--color-border)] p-4 z-[200] animate-fade-in overflow-hidden">
                   <div className="p-6 mb-4 bg-[var(--color-bg-primary)] rounded-[1.5rem]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] mb-1">Signed in as</p>
                      <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{user.email}</p>
                   </div>
                   <div className="space-y-1">
                      <Link href="/profile" className="flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] transition-all rounded-[1rem]">
                        Settings & Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all rounded-[1rem]"
                      >
                        Log Out
                      </button>
                   </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth">
              <button className="px-12 py-5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--color-accent)] rounded-full transition-all shadow-xl shadow-[var(--color-text-primary)]/5 active:scale-95 hover:-translate-y-1">
                Sign In
              </button>
            </Link>
          )}
        </div>

        {/* ─── MOBILE CONTROLS ─── */}
        <div className="flex lg:hidden items-center gap-2 sm:gap-3">
          {isAuthenticated && user && (
            <Link href="/profile" className="mr-1">
              <Avatar 
                name={user.name} 
                src={user.avatar_url ? storageService.getPublicUrl(user.avatar_url) : undefined} 
                size="sm" 
                className="w-9 h-9 sm:w-10 sm:h-10 border border-[var(--color-border)]" 
              />
            </Link>
          )}
          {isAuthenticated && (
            <button 
              onClick={() => setShowCreditModal(true)}
              className="px-2 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[8px] font-black uppercase tracking-[0.08em] text-[var(--color-accent)] hover:border-[var(--color-accent)] active:scale-90 transition-all"
            >
              {user?.credits ?? 0}
            </button>
          )}
          {isAuthenticated && <NotificationDropdown />}
          <button onClick={toggleTheme} className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full flex items-center justify-center">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-full flex items-center justify-center" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {showCreditModal && (
        <CreditPurchaseModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
      )}

      {/* ─── MOBILE MENU ─── */}
      {isOpen && (
        <div className="fixed inset-0 top-0 h-[100dvh] z-[1000] lg:hidden">
          <button
            aria-label="Close mobile menu"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
          />
          <div className="absolute right-3 top-16 sm:right-6 sm:top-20 w-[min(86vw,320px)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl p-3 shadow-2xl animate-fade-in">
           <div className="flex justify-between items-center mb-3 px-1">
              <span className="font-serif font-black text-xl text-[var(--color-text-primary)]">Navigation</span>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-full flex items-center justify-center">
                <X size={16} />
              </button>
           </div>

           <nav className="flex flex-col gap-1.5">
              {[
                ...mainNavItems,
                { label: 'Messages', href: '/chat', icon: MessageSquare },
                { label: 'Profile Settings', href: '/profile', icon: User },
              ].map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className="flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-primary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 transition-colors rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon size={15} className="text-[var(--color-accent)]" />
                  {item.label}
                </Link>
              ))}
           </nav>

           <div className="pt-3 mt-3 border-t border-[var(--color-border)] space-y-2">
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setIsOpen(false)
                    setShowCreditModal(true)
                  }}
                  className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[9px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Plus size={12} />
                  Get More Credits
                </button>
              )}
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout}
                  className="w-full py-2.5 border border-red-500 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  Log Out
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/auth')}
                  className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[9px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sign In
                </button>
              )}
           </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); filter: blur(5px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </header>
  )
}
