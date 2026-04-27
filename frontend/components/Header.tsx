'use client'

import Link from 'next/link'
import { Menu, X, ChevronDown, Zap, MessageSquare, Plus, LayoutDashboard, FileText, Users, User, Award, Shield, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Avatar from './Avatar'
import NotificationDrawer from './NotificationDrawer'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { storageService, supabase, API_URL } from '@/lib/supabase'
import CreditPurchaseModal from './CreditPurchaseModal'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const isLandingPage = pathname === '/'
  const isAdminPage = pathname.startsWith('/admin')
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { user, logout, isAuthenticated, isAdmin, viewMode, toggleViewMode, token } = useAuth()

  const fetchUnreadCount = async () => {
    try {
      if (!token) return
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setUnreadCount(data.data.length)
      }
    } catch (err) {}
  }

  useEffect(() => {
    if (!isAuthenticated) return

    fetchUnreadCount()
    
    const channel = supabase
      .channel('header-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnreadCount()
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [isAuthenticated, token])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 20)
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const mainNavItems = [
    { label: 'Hub', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Intent', href: '/collaborations', icon: FileText },
    { label: 'Wallet', href: '/credits', icon: Zap },
    { label: 'Tribes', href: '/skills', icon: Users },
    { label: 'Messages', href: '/chat', icon: MessageSquare },
  ]

  const landingNavItems = [
    { label: 'Features', href: '#features', icon: LayoutDashboard },
    { label: 'Benefits', href: '#benefits', icon: LayoutDashboard },
    { label: 'Process', href: '#process', icon: LayoutDashboard },
  ]

  const navItems = isLandingPage ? landingNavItems : mainNavItems

  // Style helpers
  const headerBackground = scrolled 
    ? (isLandingPage ? 'bg-[var(--lp-bg)] border-b border-[var(--lp-text)]/10 shadow-sm' : 'bg-[var(--color-bg-primary)] backdrop-blur-2xl bg-opacity-80 border-b border-[var(--color-border)] shadow-sm')
    : (isLandingPage ? 'bg-[var(--lp-bg)] border-b border-transparent' : 'bg-[var(--color-bg-primary)] border-b border-transparent')

  const headerTextColor = isLandingPage ? 'text-[var(--lp-text)]' : 'text-[var(--color-text-primary)]'

  return (
    <motion.header 
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-500 ${headerBackground} ${headerTextColor}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 w-full flex justify-between items-center py-2 md:py-4">
        
        {/* ─── LOGO ─── */}
        <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
          <span className={`tracking-[-0.05em] text-2xl sm:text-3xl transition-colors font-['Nunito'] font-[800] ${isLandingPage ? 'text-[var(--lp-text)]' : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]'}`}>Collixa.</span>
        </Link>

        {/* ─── RIGHT ACTION CLUSTER (Nav + Button) ─── */}
        <div className="hidden lg:flex items-center gap-2 lg:gap-10">
          <nav className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link 
                key={item.label} 
                href={item.href} 
                className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all font-sans hover:opacity-100 ${isLandingPage ? 'text-[var(--lp-text)] opacity-70' : 'text-[var(--color-text-primary)] opacity-60 hover:opacity-100'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Admin View Toggle */}
          {isAuthenticated && isAdmin && (
            <button
              onClick={() => {
                toggleViewMode()
                if (!isAdminPage) {
                  router.push('/admin')
                } else {
                  router.push('/dashboard')
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                isAdminPage
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
              }`}
            >
              <Shield size={14} />
              {isAdminPage ? 'View as User' : 'View as Admin'}
            </button>
          )}

          {isAuthenticated && user ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-4 p-1.5 pr-5 rounded-full border transition-all relative ${isLandingPage ? 'bg-transparent border-[var(--lp-text)]/20 text-[var(--lp-text)]' : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]'}`}
              >
                <div className="relative">
                  <Avatar 
                    name={user.name} 
                    src={user.avatar_url ? storageService.getPublicUrl(user.avatar_url) : undefined} 
                    size="sm" 
                  />
                  {unreadCount > 0 && (
                     <motion.div 
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-[var(--color-bg-primary)] shadow-lg"
                     >
                        {unreadCount}
                     </motion.div>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{user.name.split(' ')[0]}</span>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowProfileMenu(false)}
                      className="fixed inset-0 z-10"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl border p-2 z-20 backdrop-blur-xl ${
                        isLandingPage 
                          ? 'bg-[#F5F5F0] border-[var(--lp-text)]/10 text-[var(--lp-text)]' 
                          : 'bg-[var(--color-bg-primary)] border-[var(--color-border)]'
                      }`}
                    >
                      <div className="px-4 py-3 border-b border-black/5 mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-1">Authenticated as</p>
                        <p className="text-[14px] font-bold truncate">{user.name}</p>
                      </div>

                      <Link 
                        href="/profile" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-black/5"
                      >
                        <User size={16} />
                        <span className="text-[13px] font-semibold">View Profile</span>
                      </Link>

                      <button 
                        onClick={() => {
                          setShowProfileMenu(false)
                          setIsDrawerOpen(true)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors hover:bg-black/5"
                      >
                        <div className="flex items-center gap-3">
                          <Bell size={16} />
                          <span className="text-[13px] font-semibold">Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <Link 
                        href="/dashboard" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-black/5"
                      >
                        <LayoutDashboard size={16} />
                        <span className="text-[13px] font-semibold">Platform Dashboard</span>
                      </Link>

                      <Link 
                        href="/rewards" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-black/5"
                      >
                        <Award size={16} />
                        <span className="text-[13px] font-semibold">Rewards & Achievements</span>
                      </Link>

                      <Link 
                        href="/my-collaborations" 
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-black/5"
                      >
                        <Zap size={16} />
                        <span className="text-[13px] font-semibold">My Intents</span>
                      </Link>

                      <div className="h-[1px] bg-black/5 my-2" />

                      <div className="flex items-center justify-between px-4 py-2 hover:bg-black/5 rounded-xl transition-colors">
                        <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Dark Mode</span>
                        <ThemeToggle />
                      </div>

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-red-50 text-red-500"
                      >
                        <Zap size={16} className="rotate-12" />
                        <span className="text-[13px] font-bold">Log Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/auth">
              <button className={`px-10 py-3.5 text-[12px] font-bold tracking-tight rounded-full transition-all active:scale-95 ${
                isLandingPage 
                  ? 'bg-[var(--lp-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--lp-primary)]/20' 
                  : 'bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] hover:bg-[var(--color-accent)] shadow-xl shadow-[var(--color-text-primary)]/5'
              }`}>
                {isLandingPage ? 'Sign in' : 'Sign In'}
              </button>
            </Link>
          )}
        </div>

        {/* ─── MOBILE CONTROLS ─── */}
        <div className="flex lg:hidden items-center gap-2 sm:gap-3">
          {isAuthenticated && user && (
            <Link href="/profile" className="mr-1 relative">
              <Avatar 
                name={user.name} 
                src={user.avatar_url ? storageService.getPublicUrl(user.avatar_url) : undefined} 
                size="sm" 
                className="w-9 h-9 sm:w-10 sm:h-10 border border-[var(--color-border)]" 
              />
              {unreadCount > 0 && (
                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-[var(--color-bg-primary)] shadow-lg">
                    {unreadCount}
                 </div>
              )}
            </Link>
          )}
          <div className="flex items-center gap-2">
            {isAuthenticated && isAdmin && (
              <button
                onClick={() => {
                   toggleViewMode()
                   if (viewMode === 'user') {
                     router.push('/admin')
                   } else {
                     router.push('/dashboard')
                   }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border transition-all active:scale-95 ${
                  viewMode === 'admin'
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-accent)]'
                } text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em]`}
              >
                <Shield size={12} className="sm:w-3 sm:h-3" />
                <span>{viewMode === 'admin' ? 'User' : 'Admin'}</span>
              </button>
            )}
            <button className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] rounded-full flex items-center justify-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {showCreditModal && (
        <CreditPurchaseModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
      )}

      {/* ─── MOBILE MENU ─── */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 top-0 h-[100dvh] z-[9999] lg:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close mobile menu"
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-3 top-20 sm:right-6 sm:top-24 w-[min(86vw,320px)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl p-3 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-3 px-1">
                <span className="font-serif font-black text-xl text-[var(--color-text-primary)]">Navigation</span>
                <button onClick={() => setIsOpen(false)} className="w-8 h-8 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] rounded-full flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                {[
                  ...(isLandingPage ? landingNavItems : mainNavItems),
                  { label: 'Rewards', href: '/rewards', icon: Award },
                  { label: 'Notifications', onClick: () => setIsDrawerOpen(true), icon: Bell, count: unreadCount },
                  { label: 'Profile Settings', href: '/profile', icon: User },
                ].map((item) => {
                  const Icon = item.icon
                  const isButton = !!item.onClick
                  
                  const content = (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon size={15} className="text-[var(--color-accent)]" />
                        {item.label}
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                          {item.count}
                        </span>
                      )}
                    </>
                  )

                  if (isButton) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick!()
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-primary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 transition-colors rounded-lg"
                      >
                        {content}
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href!}
                      className="flex items-center justify-between px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-primary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/40 transition-colors rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      {content}
                    </Link>
                  )
                })}
              </nav>

              <div className="pt-3 mt-3 border-t border-[var(--color-border)] space-y-2">
                {!isLandingPage && (
                  <div className="flex items-center justify-between px-3 py-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-primary)]">Dark Mode</span>
                    <ThemeToggle />
                  </div>
                )}
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setShowCreditModal(true)
                    }}
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[9px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Plus size={12} />
                    Get More Credits
                  </button>
                )}
                {isAuthenticated && isAdmin && (
                  <button
                    onClick={() => {
                      toggleViewMode()
                      setIsOpen(false)
                    }}
                    className="w-full py-2.5 border border-[var(--color-accent)] text-[var(--color-accent)] text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[var(--color-accent-soft)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield size={12} />
                    {viewMode === 'admin' ? 'View as User' : 'View as Admin'}
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
                    className="w-full py-2.5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[9px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <NotificationDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </motion.header>
  )
}
