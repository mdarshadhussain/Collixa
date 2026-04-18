'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Award, ArrowLeft, Trophy, Sparkles, Zap, Star, Shield, Target, Users, MapPin, Globe, CreditCard } from 'lucide-react'
import Layout from '@/components/Layout'
import AchievementsSection from '@/components/AchievementsSection'
import { useAuth } from '@/app/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Transaction {
  id: string
  amount: number
  type: string
  created_at: string
}

export default function RewardsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/credits`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  if (!user) {
    if (typeof window !== 'undefined') router.push('/auth')
    return null
  }

  return (
    <Layout showSidebar={true} showBottomNav={true}>
      <div className="max-w-[1400px] mx-auto space-y-24 pb-32">
        
        {/* ─── PREMIUM HERO ─── */}
        <section className="relative rounded-[3rem] overflow-hidden group border border-[var(--color-border)] shadow-md shadow-black/5 bg-[var(--color-bg-secondary)] flex flex-col justify-center p-12 md:p-16 xl:p-20 space-y-8">
           <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg-secondary)] via-[var(--color-bg-primary)] to-[var(--color-accent)]/10" />
           
           <div className="relative z-10 space-y-4">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--color-accent)] text-[var(--color-inverse-text)] shadow-lg shadow-[var(--color-accent)]/20"
             >
               <Trophy size={14} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Platform Excellence</span>
             </motion.div>
             
             <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter leading-tight text-[var(--color-text-primary)]">
               Achieve <span className="italic font-light text-[var(--color-accent)]"> greatness.</span>
             </h1>
             
             <p className="text-lg text-[var(--color-text-secondary)] font-medium max-w-lg leading-relaxed">
               Every interaction counts toward your digital legacy. Secure rewards, build reputation, and unlock the future.
             </p>
           </div>

           <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
             {[
               { label: 'Platform Rank', value: 'Explorer', icon: Globe },
               { label: 'Credits Balance', value: user.credits ?? 0, icon: Star },
               { label: 'Engagement', value: 'High', icon: Zap },
               { label: 'Status', value: 'Verified', icon: Shield },
             ].map((stat) => (
               <div key={stat.label} className="bg-[var(--color-bg-primary)]/50 backdrop-blur-xl border border-[var(--color-border)] p-6 rounded-[2rem] hover:border-[var(--color-accent)] transition-all">
                 <stat.icon size={18} className="text-[var(--color-accent)] mb-4" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-1">{stat.label}</p>
                 <h3 className="text-2xl font-black text-[var(--color-text-primary)]">{stat.value}</h3>
               </div>
             ))}
           </div>
        </section>

        {/* ─── CATEGORY HIGHLIGHTS (Graphical) ─── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="relative bg-[var(--color-bg-secondary)] rounded-[3rem] overflow-hidden group border border-[var(--color-border)] shadow-md shadow-black/5 flex flex-col justify-start p-10 md:p-14 transition-transform duration-700 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent)]/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                 <Target className="text-[var(--color-accent)] mb-6 drop-shadow-sm" size={36} />
                 <h2 className="text-3xl font-serif font-black text-[var(--color-text-primary)] mb-3">Intent Mastery</h2>
                 <p className="text-[var(--color-text-secondary)] text-sm max-w-sm leading-relaxed">Earn rewards by launching high-impact intents and matching with the perfect collaborators.</p>
              </div>
           </div>

           <div className="relative bg-[var(--color-bg-secondary)] rounded-[3rem] overflow-hidden group border border-[var(--color-border)] shadow-md shadow-black/5 flex flex-col justify-start p-10 md:p-14 transition-transform duration-700 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
              <div className="relative z-10">
                 <Users className="text-blue-500 mb-6 drop-shadow-sm" size={36} />
                 <h2 className="text-3xl font-serif font-black text-[var(--color-text-primary)] mb-3">Global Intent</h2>
                 <p className="text-[var(--color-text-secondary)] text-sm max-w-sm leading-relaxed">Connecting minds and sharing visions. Complete joint intents to unlock crystalline rewards.</p>
              </div>
           </div>
        </section>

        {/* ─── TRANSACTION HISTORY ─── */}
        <section className="space-y-12">
           <div className="space-y-4 px-4">
              <h2 className="text-4xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">Credit Audit</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Transaction Timeline • Balance Flows</p>
           </div>

           <div className="bg-[var(--color-bg-secondary)] rounded-[3rem] border border-[var(--color-border)] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Date</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Activity</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40">Type</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Adjustment</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                       <AnimatePresence>
                          {transactions.length > 0 ? (
                            transactions.map((tx, i) => (
                               <motion.tr 
                                 key={tx.id}
                                 initial={{ opacity: 0, x: -10 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: i * 0.05 }}
                                 className="group hover:bg-[var(--color-bg-secondary)]/50 transition-colors"
                               >
                                  <td className="px-8 py-6 text-[11px] font-medium text-[var(--color-text-secondary)]">
                                     {format(new Date(tx.created_at), 'MMM dd, yyyy • HH:mm')}
                                  </td>
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                           tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                                        }`}>
                                           {tx.amount > 0 ? <Zap size={14} /> : <Zap size={14} className="rotate-180" />}
                                        </div>
                                        <span className="text-sm font-black text-[var(--color-text-primary)]">
                                           {tx.amount > 0 ? 'Reward Earned' : 'Credit Transfer'}
                                        </span>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6">
                                     <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[var(--color-bg-secondary)] rounded-full border border-[var(--color-border)]">
                                        {tx.type}
                                     </span>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                     <span className={`text-base font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount} CR
                                     </span>
                                  </td>
                               </motion.tr>
                            ))
                          ) : (
                            <tr>
                               <td colSpan={4} className="px-8 py-20 text-center text-sm text-[var(--color-text-secondary)] italic">
                                  No transactions discovered yet. Start exploring to earn credits.
                               </td>
                            </tr>
                          )}
                       </AnimatePresence>
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
        <section className="space-y-12 bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border)] rounded-[4rem] p-12 md:p-20 relative overflow-hidden">
           <div className="absolute top-0 left-0 p-12 opacity-5 pointer-events-none -rotate-12">
              <Star size={300} />
           </div>
           
           <div className="relative z-10 space-y-12">
              <div className="text-center md:text-left space-y-4">
                 <h2 className="text-4xl md:text-5xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">Inventory of Achievements</h2>
                 <p className="text-base text-[var(--color-text-primary)] opacity-60 max-w-xl">Every trophy earned adds to your permanent platform standing. Track your progress across all disciplines below.</p>
              </div>
              
              <div className="bg-[var(--color-bg-primary)]/40 rounded-[3rem] p-8 md:p-12 border border-[var(--color-border)] shadow-xl">
                <AchievementsSection userId={user.id} />
              </div>
           </div>
        </section>

      </div>
    </Layout>
  )
}
