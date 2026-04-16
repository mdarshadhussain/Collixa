'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, Sparkles, Zap, ArrowRight, Home, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import Header from '@/components/Header'

const PACKAGES = {
  'starter': { name: 'Curious Case', credits: 100, color: 'from-blue-400 to-indigo-500' },
  'pro': { name: 'Collector', credits: 250, color: 'from-amber-400 to-orange-500' },
  'premium': { name: 'Architect', credits: 750, color: 'from-emerald-400 to-teal-600' },
  'ultimate': { name: 'The Editorial', credits: 2000, color: 'from-rose-400 to-purple-600' }
}

function SuccessContent() {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const searchParams = useSearchParams()
  
  // Support both package-based and generic transactions
  const packageId = searchParams.get('package')
  const amount = parseInt(searchParams.get('amount') || '0')
  const type = searchParams.get('type') || (packageId ? 'PURCHASE' : 'TRANSACTION')
  const recipient = searchParams.get('recipient')

  const pkg = packageId ? ((PACKAGES as any)[packageId] || PACKAGES.starter) : null
  const displayCredits = pkg ? pkg.credits : amount
  const displayColor = pkg ? pkg.color : 'from-[var(--color-accent)] to-[var(--color-accent-soft)]'
  const displayName = pkg ? pkg.pkgName : (type === 'BONUS' ? 'Admin Bonus' : type === 'TRANSFER' ? 'Credit Transfer' : 'Transaction')

  const [counter, setCounter] = useState(0)

  useEffect(() => {
    // Trigger real balance sync in background
    refreshUser()
    
    // Satisfying counter animation for the credits added
    const target = displayCredits
    if (target <= 0) {
      setCounter(0)
      return
    }

    const duration = 2000
    const steps = 60
    const increment = Math.ceil(target / steps)
    const intervalTime = duration / steps

    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCounter(target)
        clearInterval(timer)
      } else {
        setCounter(current)
      }
    }, intervalTime)

    return () => clearInterval(timer)
  }, [displayCredits, refreshUser])

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-4 pb-12 md:pt-8 md:pb-16 text-center">
        <div className="space-y-5 md:space-y-6">
          
          {/* ─── SUCCESS ICON ─── */}
          <div className="relative inline-block">
            <motion.div 
               initial={{ scale: 0, rotate: -45 }}
               animate={{ scale: 1, rotate: 0 }}
               transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
               className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${displayColor} flex items-center justify-center text-white shadow-xl shadow-[var(--color-accent)]/10 rotate-12`}
            >
              <Check size={28} className="sm:w-8 md:w-10 sm:h-8 md:h-10" strokeWidth={3} />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.1, 0.2] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -inset-4 bg-[var(--color-accent)]/20 rounded-full blur-2xl -z-10" 
            />
          </div>

          {/* ─── HEADLINE ─── */}
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent-soft)]/20 rounded-full border border-[var(--color-accent)]/20"
            >
               <Sparkles size={10} className="text-[var(--color-accent)]" />
               <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">Manifested</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl sm:text-3xl md:text-5xl font-serif font-black tracking-tighter leading-tight"
            >
              Transaction <br />
              <span className="italic font-light text-[var(--color-accent)]">Archived.</span>
            </motion.h1>
          </div>

          {/* ─── CREDIT ACCUMULATION ─── */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-5 sm:p-6 rounded-[1.5rem] md:rounded-[2rem] max-w-[320px] sm:max-w-sm mx-auto relative overflow-hidden shadow-lg"
          >
             <div className="relative space-y-2">
                <p className="text-[7px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)]">Vault Deposit</p>
                <div className="flex items-center justify-center gap-3">
                   <Zap size={18} className="text-[var(--color-accent)] fill-[var(--color-accent)]" />
                   <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tighter tabular-nums">+{counter}</h2>
                </div>
                <div className="pt-3 border-t border-[var(--color-border)] opacity-60">
                   <p className="text-[7px] font-bold uppercase tracking-widest leading-loose">
                     Account Balance Updated <br />
                     {recipient ? (
                       <>To: <span className="text-[var(--color-text-primary)] font-black">{recipient}</span></>
                     ) : (
                       <>Tier: <span className="text-[var(--color-text-primary)] font-black">{pkg?.name || displayName}</span></>
                     )}
                   </p>
                </div>
             </div>
          </motion.div>

          {/* ─── ACTIONS ─── */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-3 md:pt-4"
          >
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[9px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-[var(--color-accent)] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 group"
            >
              The Sanctuary
              <LayoutDashboard size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/profile"
              className="w-full sm:w-auto px-8 py-3.5 border border-[var(--color-border)] text-[var(--color-text-primary)] text-[9px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-[var(--color-bg-secondary)] transition-all active:scale-95 flex items-center justify-center gap-3 group"
            >
              Statistics
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

        </div>
      </main>

      <footer className="fixed bottom-4 md:bottom-6 left-0 w-full text-center opacity-30 select-none px-4">
         <p className="text-[7px] font-serif italic tracking-widest uppercase truncate">Collixa Intelligence Protocol • Identity Verified</p>
      </footer>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center"><Zap className="animate-pulse text-[var(--color-accent)]" /></div>}>
      <SuccessContent />
    </Suspense>
  )
}
