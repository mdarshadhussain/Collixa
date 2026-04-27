'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Zap, Crown, Gem, Check, ArrowRight, Loader2, Award } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'

interface CreditPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
}

const PACKAGES = [
  {
    id: 'starter',
    name: 'Curious Case',
    credits: 100,
    price: '$5',
    description: 'Perfect for exploring a few niche skills.',
    icon: Sparkles,
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'pro',
    name: 'Collector',
    credits: 250,
    price: '$10',
    description: 'Grow your expertise with a significant credit boost.',
    icon: Zap,
    color: 'from-amber-400 to-orange-500',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Architect',
    credits: 750,
    price: '$25',
    description: 'Master your field with heavy collaboration power.',
    icon: Crown,
    color: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'ultimate',
    name: 'The Editorial',
    credits: 2000,
    price: '$50',
    description: 'Limitless influence within the Intent economy.',
    icon: Gem,
    color: 'from-rose-400 to-purple-600',
  }
]

const TIER_RULES: Record<string, { bonus: number }> = {
  'Nomad': { bonus: 0.00 },
  'Architect': { bonus: 0.02 },
  'Luminary': { bonus: 0.05 },
  'Oracle': { bonus: 0.10 }
}

export default function CreditPurchaseModal({ isOpen, onClose }: CreditPurchaseModalProps) {
  const router = useRouter()
  const { user, token, refreshUser } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeTier = user?.tier || 'Nomad'
  const bonusMultiplier = TIER_RULES[activeTier].bonus

  // Block scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handlePurchase = async (pkg: any) => {
    setLoading(pkg.id)
    setError(null)
    await new Promise(resolve => setTimeout(resolve, 500)) 
    router.push(`/checkout?package=${pkg.id}`)
    onClose()
    setLoading(null)
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xl" 
        onClick={handleClose} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
      >
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto no-scrollbar relative min-h-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-soft)]" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4 lg:mb-6">
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] block italic leading-none">Wealth & Power</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tighter italic leading-tight text-[var(--color-text-primary)]">Acquire.</h2>
              <p className="text-[8px] md:text-[9px] text-[var(--color-text-secondary)] font-medium max-w-md opacity-70">Unlock premium capabilities across the marketplace.</p>
            </div>
            <div className="flex items-center gap-3">
              {bonusMultiplier > 0 && (
                <div className="px-3 py-1.5 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded-full flex items-center gap-2">
                   <Award size={12} className="text-[var(--color-accent)]" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)]">{activeTier} Bonus: +{bonusMultiplier * 100}%</span>
                </div>
              )}
              <button 
                onClick={onClose}
                className="w-8 h-8 md:w-10 md:h-10 border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-[var(--color-bg-primary)] transition-all bg-[var(--color-bg-primary)]/50 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {PACKAGES.map((pkg) => {
              const Icon = pkg.icon
              const isProcessing = loading === pkg.id
              const bonusAmount = Math.floor(pkg.credits * bonusMultiplier)
              const totalCredits = pkg.credits + bonusAmount

              return (
                <div 
                  key={pkg.id}
                  className={`relative group flex flex-col p-4 lg:p-5 rounded-[1.2rem] lg:rounded-[1.8rem] border transition-all duration-500 bg-[var(--color-bg-primary)] hover:shadow-2xl hover:-translate-y-1 ${
                    pkg.popular ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20' : 'border-[var(--color-border)]'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[6px] md:text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg z-20">
                      Primary
                    </div>
                  )}

                  <div className="space-y-2 lg:space-y-3 flex-1">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white mb-1 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>

                    <div>
                      <h3 className="text-xs lg:text-sm font-serif font-black leading-tight line-clamp-1">{pkg.name}</h3>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg lg:text-2xl font-serif font-black text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{totalCredits}</span>
                        <span className="text-[6px] lg:text-[7px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Creds</span>
                      </div>
                      {bonusAmount > 0 && (
                        <p className="text-[7px] font-black text-[var(--color-accent)] uppercase tracking-widest mt-1">
                          +{bonusAmount} rank bonus
                        </p>
                      )}
                    </div>

                    <p className="hidden sm:block text-[8px] lg:text-[9px] text-[var(--color-text-secondary)] font-medium leading-relaxed line-clamp-2 opacity-60">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="mt-3 lg:mt-5 pt-2 lg:pt-3 border-t border-[var(--color-border)]/50 space-y-2 lg:space-y-3">
                    <div className="flex items-center justify-between">
                       <p className="text-base lg:text-xl font-serif font-black">{pkg.price}</p>
                    </div>
                    
                    <button
                      disabled={!!loading}
                      onClick={() => handlePurchase(pkg)}
                      className={`w-full py-2 lg:py-3 rounded-lg lg:rounded-xl text-[7px] lg:text-[8px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                        pkg.popular 
                          ? 'bg-[var(--color-accent)] text-[var(--color-inverse-text)] hover:bg-[var(--color-inverse-bg)]' 
                          : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : (
                        <>Select <ArrowRight className="w-3 h-3" /></>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-3 md:py-4 bg-[var(--color-bg-primary)]/50 border-t border-[var(--color-border)] flex items-center justify-between text-[8px] md:text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1.5"><Check size={10} className="text-green-500" /> Secure</span>
             <span className="flex items-center gap-1.5 hidden sm:flex"><Check size={10} className="text-green-500" /> Identity Protected</span>
          </div>
          <p>© 2026 COLLIXA ENGINE</p>
        </div>
      </motion.div>
    </div>
  )
}
