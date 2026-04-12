'use client'

import Link from 'next/link'
import { Menu, X, ChevronDown, Sun, Moon, Search, LayoutGrid, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import Avatar from './Avatar'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
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

  return (
    <header className={`sticky top-0 z-[100] w-full transition-all duration-700 ${
      scrolled 
        ? 'py-4 bg-[var(--color-bg-primary)]/80 backdrop-blur-2xl border-b border-[var(--color-border)] shadow-sm' 
        : 'py-8 bg-[var(--color-bg-primary)] border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full flex justify-between items-center">
        
        {/* ─── LOGO (EDITORIAL ARCHETYPE) ─── */}
        <Link href="/" className="flex items-center gap-6 group">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-[var(--color-accent)] rounded-[1.5rem] rotate-45 transform transition-transform group-hover:rotate-0 duration-700 opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[var(--color-accent)] font-serif text-3xl font-black italic">C.</span>
            </div>
          </div>
          <span className="hidden md:block font-serif font-black tracking-[-0.05em] text-3xl text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">Collixa.</span>
        </Link>

        {/* ─── DESKTOP NAVIGATION ─── */}
        <nav className="hidden lg:flex items-center gap-16">
          {[
            { label: 'Projects', href: '/dashboard', icon: LayoutGrid },
            { label: 'My Projects', href: '/my-intents', icon: Search },
            { label: 'Community', href: '/skills', icon: Zap },
          ].map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              className="group relative text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all flex items-center gap-3"
            >
              <item.icon size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              {item.label}
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-[var(--color-accent)] transition-all duration-500 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* ─── ACTION CLUSTER ─── */}
        <div className="hidden lg:flex items-center gap-10">
          
          <button 
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-center transition-all bg-[var(--color-bg-secondary)] shadow-sm overflow-hidden group"
          >
            <div className="relative w-6 h-6">
               <Sun className={`absolute inset-0 transition-all duration-1000 ${theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'} text-[var(--color-accent)]`} size={24} />
               <Moon className={`absolute inset-0 transition-all duration-1000 ${theme === 'light' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'} text-[var(--color-text-primary)]`} size={24} />
            </div>
          </button>

          {isAuthenticated && user ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-5 p-2 pr-6 rounded-[2rem] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] transition-all shadow-sm group"
              >
                <Avatar name={user.name} size="sm" className="ring-2 ring-offset-2 ring-offset-[var(--color-bg-primary)] ring-[var(--color-accent-soft)]" />
                <div className="text-left">
                  <p className="text-[10px] font-black tracking-tight text-[var(--color-text-primary)]">{user.name.split(' ')[0]}</p>
                </div>
                <ChevronDown size={14} className={`text-[var(--color-text-secondary)] transition-transform duration-500 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-6 w-64 bg-[var(--color-bg-secondary)] rounded-[2.5rem] shadow-2xl border border-[var(--color-border)] p-4 z-[200] animate-fade-in overflow-hidden">
                   <div className="p-6 mb-4 bg-[var(--color-bg-primary)] rounded-[1.5rem]">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] mb-1">Signed in as</p>
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
        <div className="flex lg:hidden items-center gap-6">
          <button onClick={toggleTheme} className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button className="p-3 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-full" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ─── MOBILE MENU ─── */}
      {isOpen && (
        <div className="fixed inset-0 top-0 h-screen bg-[var(--color-bg-primary)] z-[1000] p-12 space-y-16 animate-fade-in lg:hidden">
           <div className="flex justify-between items-center">
              <span className="font-serif font-black text-4xl italic text-[var(--color-text-primary)]">Collixa.</span>
              <button onClick={() => setIsOpen(false)} className="p-4 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-full">
                <X size={32} />
              </button>
           </div>
           
           <nav className="flex flex-col gap-10">
              {[
                { label: 'Projects', href: '/dashboard' },
                { label: 'My Projects', href: '/my-intents' },
                { label: 'Community', href: '/skills' },
                { label: 'Messages', href: '/chat' },
              ].map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className="text-5xl font-serif font-black italic text-[var(--color-text-primary)] tracking-tight hover:text-[var(--color-accent)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
           </nav>

           <div className="pt-12 border-t border-[var(--color-border)]">
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout}
                  className="w-full py-8 border border-red-500 text-red-500 font-serif italic text-3xl rounded-[2rem]"
                >
                  Log Out
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/auth')}
                  className="w-full py-8 bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-serif italic text-3xl rounded-[2rem]"
                >
                  Sign In
                </button>
              )}
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

