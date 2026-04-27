'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search, Send, User as UserIcon, Loader2, Sparkles, AlertCircle, CreditCard, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '@/lib/supabase'

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface ShareCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  recipientEmail?: string
  recipientName?: string
  recipientId?: string
}

const TIER_RULES: Record<string, { fee: number }> = {
  'Nomad': { fee: 0.10 },
  'Architect': { fee: 0.08 },
  'Luminary': { fee: 0.05 },
  'Oracle': { fee: 0.02 }
}

export default function ShareCreditsModal({ isOpen, onClose, onSuccess, recipientEmail, recipientName, recipientId }: ShareCreditsModalProps) {
  const router = useRouter()
  const { user: currentUser, refreshUser } = useAuth()
  const [email, setEmail] = useState(recipientEmail || '')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [foundUser, setFoundUser] = useState<User | null>(
    (recipientId || recipientEmail) && recipientName ? { id: recipientId || '', name: recipientName, email: recipientEmail || '' } : null
  )
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const tierRule = TIER_RULES[currentUser?.tier || 'Nomad']
  const creditAmount = parseInt(amount) || 0
  const feeAmount = Math.ceil(creditAmount * tierRule.fee)
  const totalDeduction = creditAmount + feeAmount

  useEffect(() => {
    if (isOpen) {
      setEmail(recipientEmail || '')
      setAmount('')
      setMessage('')
      setFoundUser((recipientId || recipientEmail) && recipientName ? { id: recipientId || '', name: recipientName, email: recipientEmail || '' } : null)
      setError('')
      setSuccess('')
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen, recipientEmail, recipientName])

  const searchUser = async () => {
    const searchEmail = email.trim().toLowerCase()
    if (!searchEmail) {
      setError('Enter an email address')
      return
    }

    setSearching(true)
    setError('')
    setFoundUser(null)

    try {
      const response = await fetch(`${API_URL}/api/credits/search-user?email=${encodeURIComponent(searchEmail)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setFoundUser(data.data)
      } else {
        setError(data.error || 'Identity not found in database')
      }
    } catch (err) {
      setError('Connection failed. Retrying...')
    } finally {
      setSearching(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (foundUser) setFoundUser(null)
    if (error) setError('')
  }

  const handleSend = async () => {
    if (!foundUser) {
      setError('Identify recipient first')
      return
    }

    if (!creditAmount || creditAmount <= 0) {
      setError('Enter a valid allocation')
      return
    }

    if (totalDeduction > (currentUser?.credits || 0)) {
      setError(`Insufficient pool. Total ${totalDeduction} Creds required (incl. fee).`)
      return
    }

    setSending(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/credits/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          recipientId: foundUser.id || undefined,
          recipientEmail: !foundUser.id ? foundUser.email : undefined,
          amount: creditAmount,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        await refreshUser()
        if (onSuccess) onSuccess()
        router.push(`/payment/success?amount=${totalDeduction}&fee=${feeAmount}&principal=${creditAmount}&type=TRANSFER&recipient=${encodeURIComponent(foundUser.name)}`)
        onClose()
      } else {
        setError(data.error || 'Transaction failed')
      }
    } catch (err) {
      setError('Protocol error during transfer')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden shadow-black/50"
      >
        {/* Header Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent)] to-transparent opacity-50" />
        
        <div className="p-8 space-y-6">
          {/* Title Section */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
               <span className="text-[8px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] block italic">Wealth Protocol</span>
               <h3 className="text-3xl font-serif font-black tracking-tighter italic text-[var(--color-text-primary)]">Transfer.</h3>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg-primary)] transition-all bg-[var(--color-bg-primary)]/50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Balance Badge */}
            <div className="bg-[var(--color-bg-primary)]/60 backdrop-blur-md border border-[var(--color-border)] rounded-2xl p-4 flex items-center justify-between group transition-all duration-500">
               <div>
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mb-1">Available Reserve</p>
                 <p className="text-2xl font-serif font-black text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{currentUser?.credits || 0} <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Creds</span></p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mb-1">{currentUser?.tier || 'Nomad'} Rank</p>
                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)] opacity-60">Fee: {tierRule.fee * 100}%</p>
               </div>
            </div>

            {/* Email Search - Hidden if recipient is pre-defined */}
            {!recipientId && !recipientEmail && (
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-2">Recipient Email</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="name@nexus.com"
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-xs font-bold focus:border-[var(--color-accent)] outline-none transition-all pr-14"
                  />
                  <button
                    onClick={searchUser}
                    disabled={searching || !email.trim()}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-xl hover:bg-[var(--color-inverse-bg)] transition-all flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/20 active:scale-95 disabled:opacity-50"
                  >
                    {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Found User / Identity Card */}
            <AnimatePresence mode="wait">
              {foundUser && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent border border-[var(--color-accent)]/30 rounded-2xl p-4 overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[var(--color-accent)]/20 rotate-3">
                      {foundUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[var(--color-text-primary)] leading-none">{foundUser.name}</p>
                      <p className="text-[8px] font-medium text-[var(--color-text-secondary)] mt-1.5 uppercase tracking-widest">{foundUser.email}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-2">Allocation</label>
                 <input
                   type="number"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="100"
                   className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-xs font-mono font-bold focus:border-[var(--color-accent)] outline-none transition-all"
                 />
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-2">Protocol Note</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Optional message..."
                    className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-xs font-bold focus:border-[var(--color-accent)] outline-none transition-all"
                  />
               </div>
            </div>

            {/* Fee Breakdown */}
            {creditAmount > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2"
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-[var(--color-text-secondary)]">
                   <span className="uppercase tracking-widest">Protocol Fee ({tierRule.fee * 100}%)</span>
                   <span className="font-serif">+{feeAmount} Creds</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-[var(--color-text-primary)] border-t border-white/5 pt-2">
                   <span className="uppercase tracking-widest">Total Deduction</span>
                   <span className="text-[var(--color-accent)] font-serif">{totalDeduction} Creds</span>
                </div>
              </motion.div>
            )}

            {/* Feedback Messages */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-red-500">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <button
               onClick={handleSend}
               disabled={sending || !foundUser || !amount}
               className="w-full py-5 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] rounded-3xl text-[9px] font-black uppercase tracking-[0.5em] hover:bg-[var(--color-accent)] transition-all shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {sending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Execute Transfer
                  <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-center text-[7px] font-black uppercase tracking-widest opacity-20">Transaction securely recorded on Collixa Ledger</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
