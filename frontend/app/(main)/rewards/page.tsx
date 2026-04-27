'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Award, ArrowLeft, Trophy, Sparkles, Zap, Star, Shield, Target, Users, MapPin, Globe, CreditCard, Send, Rocket, Clock, Activity, ChevronRight, Compass, Layout, Flame, Eye, TrendingUp, Info, ChevronDown, ChevronUp, X, CheckCircle2 } from 'lucide-react'
import Badge from '@/components/Badge'
import AchievementsSection from '@/components/AchievementsSection'
import { useAuth } from '@/app/context/AuthContext'
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function RewardsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [gamification, setGamification] = useState<any>(null)
  const [xpHistory, setXpHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showXPDetails, setShowXPDetails] = useState(false)
  const [selectedTier, setSelectedTier] = useState<any>(null)
  const [activeScrollIndex, setActiveScrollIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (token) {
      // Fetch Progress
      fetch(`${API_URL}/api/intents/hub/gamification`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setGamification(data.data)
        })

      // Fetch History
      fetch(`${API_URL}/api/intents/hub/gamification/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setXpHistory(data.data)
          setLoading(false)
        })
    }
  }, [token])

  // Handle mobile scroll highlighting
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const width = container.offsetWidth;
      const cardWidth = 280; // Approximate card width + gap
      const index = Math.round(scrollLeft / cardWidth);
      setActiveScrollIndex(index);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  if (!user) return null

  const TIERS = [
    { 
      name: 'Nomad', 
      level: '1+', 
      tagline: 'The Journey Begins',
      benefits: ['Access to Marketplace', 'Basic Profile', '10% Transfer Fee'], 
      details: {
        fee: '10%',
        bonus: '0%',
        achvBonus: '0%',
        intents: '10 / month',
        tribes: '3 / month'
      },
      icon: Compass, 
      color: 'from-blue-500/20 to-transparent' 
    },
    { 
      name: 'Architect', 
      level: '10+', 
      tagline: 'Master of Structure',
      benefits: ['8% Transfer Fee', 'Architect Badge', 'Enhanced Analytics'], 
      details: {
        fee: '8%',
        bonus: '2%',
        achvBonus: '2%',
        intents: '20 / month',
        tribes: '5 / month'
      },
      icon: Layout, 
      color: 'from-emerald-500/20 to-transparent' 
    },
    { 
      name: 'Luminary', 
      level: '25+', 
      tagline: 'Vanguard of Influence',
      benefits: ['5% Transfer Fee', 'Prioritized Matching', 'Early Access'], 
      details: {
        fee: '5%',
        bonus: '5%',
        achvBonus: '5%',
        intents: '30 / month',
        tribes: '8 / month'
      },
      icon: Flame, 
      color: 'from-orange-500/10 to-transparent' 
    },
    { 
      name: 'Oracle', 
      level: '50+', 
      tagline: 'Soul of the Network',
      benefits: ['2% Transfer Fee', 'Oracle Status', 'Collixa Governance'], 
      details: {
        fee: '2%',
        bonus: '10%',
        achvBonus: '10%',
        intents: '40 / month',
        tribes: '12 / month'
      },
      icon: Eye, 
      color: 'from-[var(--color-accent)]/10 to-transparent' 
    },
  ]

  const xpLeft = gamification ? gamification.nextThreshold - (user?.xp || 0) : 0

  return (
    <>
      <div className="max-w-[1400px] mx-auto space-y-12 pb-24 mt-0 px-4 md:px-0">
        
        {/* ─── INTERACTIVE XP HERO ─── */}
        <section className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] p-6 md:p-12 shadow-2xl shadow-black/40 border border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--color-accent)]/10 to-transparent rounded-full blur-[120px] opacity-40 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="space-y-6 max-w-2xl text-center lg:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="p-2 bg-[var(--color-accent)] text-black rounded-xl shadow-lg shadow-[var(--color-accent)]/20">
                   <Trophy size={20} className="animate-bounce" />
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter leading-tight">
                  Achieve <span className="italic text-[var(--color-accent)] brightness-110"> greatness.</span>
                </h1>
              </div>

              <p className="text-sm md:text-base text-white/50 font-medium max-w-lg leading-relaxed mx-auto lg:mx-0">
                You are currently a <span className="text-white font-black italic">{gamification?.tier || 'Nomad'}</span>. <br className="hidden md:block" /> Every contribution unlocks a piece of the future.
              </p>
            </div>

            {/* INTERACTIVE XP COMMAND CENTER */}
            {gamification && (
              <motion.div 
                layout
                onClick={() => setShowXPDetails(!showXPDetails)}
                className="w-full lg:w-[400px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 cursor-pointer hover:bg-black/60 hover:border-white/20 transition-all group relative overflow-hidden"
              >
                  <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent skew-x-12 pointer-events-none"
                  />

                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                          <TrendingUp size={16} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">Level {gamification.level}</p>
                          <p className="text-[8px] font-medium text-white/30 uppercase tracking-[0.2em]">Ascent Pulse</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className="text-lg font-black text-white">{gamification.percentage}%</span>
                       {showXPDetails ? <ChevronUp size={14} className="inline ml-2 text-white/40" /> : <ChevronDown size={14} className="inline ml-2 text-white/40" />}
                    </div>
                  </div>
                  
                  <div className="h-4 w-full bg-white/5 rounded-full border border-white/10 p-1 mb-2 relative">
                    <motion.div 
                      layout
                      initial={{ width: 0 }}
                      animate={{ width: `${gamification.percentage}%` }}
                      className="h-full bg-gradient-to-r from-[var(--color-accent)] to-pink-500 rounded-full shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.6)] relative"
                    >
                       <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full blur-[1px] animate-pulse" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {showXPDetails ? (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-6 space-y-4 border-t border-white/5 mt-4"
                      >
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                               <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Total Experience</p>
                               <p className="text-base font-black text-[var(--color-accent)]">{user.xp} XP</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                               <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Threshold</p>
                               <p className="text-base font-black text-white">{gamification.nextThreshold} XP</p>
                            </div>
                         </div>
                         <div className="bg-[var(--color-accent)]/5 p-4 rounded-2xl border border-[var(--color-accent)]/20 text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mb-1">To Next Level</p>
                            <p className="text-xl font-black text-white italic">{(gamification?.nextThreshold || 0) - (user?.xp || 0)} <span className="text-[var(--color-accent)] font-serif">XP remaining</span></p>
                         </div>
                         <p className="text-[8px] text-center text-white/20 font-medium uppercase tracking-widest">Global Ranking: #124</p>
                      </motion.div>
                    ) : (
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/20 mt-4 px-1">
                         <span>Level {gamification.level}</span>
                         <span className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={8} className={i <= (gamification?.level / 10 + 1) ? "text-[var(--color-accent)] fill-[var(--color-accent)]" : "text-white/10"} />
                            ))}
                         </span>
                         <span>Level {gamification.level + 1}</span>
                      </div>
                    )}
                  </AnimatePresence>
              </motion.div>
            )}
          </div>
        </section>

        {/* ─── THE ASCENT ROADMAP ─── */}
        <section className="space-y-10 py-4">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
              <div className="space-y-1">
                 <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">The Ascent Roadmap.</h2>
                 <p className="text-[10px] md:text-[11px] text-[var(--color-text-secondary)] font-black uppercase tracking-[0.3em] opacity-40">Journey from collaborator to governance partner</p>
              </div>
           </div>

           <div 
             className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0 relative"
           >
              <div className="hidden lg:block absolute top-[110px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none opacity-40" />

              {TIERS.map((t, idx) => {
                const isActive = gamification?.tier === t.name;
                const isAutoHighlighted = activeScrollIndex === idx;
                
                return (
                  <motion.div 
                    key={t.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedTier(t)}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`group relative p-4 md:p-8 rounded-[2rem] md:rounded-[3.5rem] border transition-all duration-700 flex flex-col justify-between min-h-[180px] md:min-h-[340px] w-full shrink-0 overflow-hidden cursor-pointer ${
                      isActive 
                      ? 'bg-[#001233] border-[var(--color-accent)] shadow-[0_20px_50px_rgba(var(--color-accent-rgb),0.3)] ring-2 ring-[var(--color-accent)]/30 scale-[1.02] z-10' 
                      : (isAutoHighlighted ? 'bg-[#000814] border-white/20 scale-[1.01] opacity-100 shadow-xl' : 'bg-[#000814] border-white/5 opacity-85 hover:opacity-100 hover:scale-[1.02] hover:border-white/20')
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-black shadow-lg shadow-[var(--color-accent)]/20 scale-100 sm:scale-110">
                         <div className="w-1 h-1 rounded-full bg-black animate-pulse" />
                         <span className="text-[6px] font-black uppercase tracking-widest">Active</span>
                      </div>
                    )}

                    <div className={`absolute -bottom-6 -right-6 ${isActive || isAutoHighlighted ? 'text-[var(--color-accent)] opacity-[0.06]' : 'text-white opacity-[0.03]'} group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none select-none`}>
                      <t.icon size={220} strokeWidth={1} />
                    </div>

                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${t.color} blur-[40px] opacity-40 group-hover:opacity-60 transition-opacity`} />
                    
                    <div className="space-y-4 md:space-y-6 relative z-10">
                      <div className="flex justify-between items-start">
                         <div className={`w-8 h-8 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${(isActive || isAutoHighlighted) ? 'bg-[var(--color-accent)] text-black shadow-lg shadow-[var(--color-accent)]/30 animate-pulse' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                            <t.icon size={14} className={`md:w-[26px] md:h-[26px] ${(isActive || isAutoHighlighted) ? 'text-black' : ''}`} />
                         </div>
                         {!isActive && (
                            <Badge variant="secondary" className={`hidden md:flex bg-white/5 border border-white/10 text-white/30 uppercase tracking-widest text-[8px] px-3 font-black`}>Level {t.level}</Badge>
                         )}
                      </div>

                      <div>
                        <h3 className={`text-md md:text-3xl font-serif font-black italic mb-1 tracking-tighter leading-none ${(isActive || isAutoHighlighted) ? 'text-[var(--color-accent)]' : 'text-white'}`}>{t.name}</h3>
                        {isActive && (
                          <div className="flex items-center gap-1.5 mt-2">
                             <TrendingUp size={10} className="text-[var(--color-accent)]" />
                             <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] brightness-110">Unlocked & Verified</p>
                          </div>
                        )}
                      </div>

                      <ul className="space-y-1.5 md:space-y-3 pt-1 md:pt-2">
                         {t.benefits.slice(0, 3).map(b => (
                           <li key={b} className={`flex items-center gap-2 text-[8px] md:text-[10px] font-bold leading-tight group-hover:text-white transition-colors ${(isActive || isAutoHighlighted) ? 'text-white/80' : 'text-white/40'}`}>
                              <Zap size={6} className="text-[var(--color-accent)] shrink-0 md:w-[10px]" /> <span className="truncate">{b}</span>
                           </li>
                         ))}
                      </ul>
                    </div>

                    <div className={`pt-4 md:pt-6 flex items-center justify-between relative z-10 transition-colors`}>
                       <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${(isActive || isAutoHighlighted) ? 'text-[var(--color-accent)]' : 'opacity-20 group-hover:opacity-100 group-hover:text-[var(--color-accent)]'}`}>Level Details</p>
                       <div className={`p-1.5 md:p-2 rounded-full border border-white/10 group-hover:border-[var(--color-accent)]/50 transition-colors bg-white/5`}>
                          <ChevronRight size={12} className={`transition-all ${(isActive || isAutoHighlighted) ? 'text-[var(--color-accent)] translate-x-0.5' : 'opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 text-white group-hover:text-[var(--color-accent)]'} md:w-[14px]`} />
                       </div>
                    </div>
                  </motion.div>
                );
              })}
           </div>
        </section>

        {/* ─── INVENTORY & ACTIVITY GRID ─── */}
        <section className="space-y-8">
           <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 px-4">
                 <div className="flex items-center gap-5">
                    <div className="p-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-inner">
                       <Award size={24} className="text-[var(--color-accent)]" />
                    </div>
                    <div>
                       <h2 className="text-xl md:text-3xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">Reputation Inventory</h2>
                       <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40 mt-1">Confirmed Proof of Contribution</p>
                    </div>
                 </div>
                 <div className="hidden sm:flex flex-col items-end">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-1">Lifetime Experience</p>
                    <Badge variant="secondary" className="bg-[var(--color-accent)] text-black uppercase tracking-[0.2em] px-4 py-1.5 font-black shadow-lg text-[9px]">{user.xp || 0} XP</Badge>
                 </div>
              </div>
              <div className="bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] p-2 md:p-6 border border-[var(--color-border)] shadow-xl shadow-black/5">
                <AchievementsSection userId={user.id} />
              </div>
           </div>

           <div className="space-y-8 bg-[var(--color-bg-secondary)]/30 border border-[var(--color-border)] rounded-[3rem] p-8 md:p-12 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                   <div className="flex items-center gap-3">
                      <Activity size={18} className="text-[var(--color-accent)] animate-pulse" />
                      <h3 className="text-xl font-serif font-black tracking-tight text-[var(--color-text-primary)]">Progression Log</h3>
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40">System-level event history</p>
                </div>
                <div className="px-4 py-2 bg-[var(--color-accent-soft)]/10 border border-[var(--color-accent)]/20 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">Live Feed</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                 <AnimatePresence>
                   {xpHistory.length > 0 ? xpHistory.map((log, idx) => (
                     <motion.div
                       key={log.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.05 }}
                       className="p-5 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-between group hover:border-[var(--color-accent)]/50 transition-all shadow-sm hover:shadow-md"
                     >
                        <div className="space-y-1.5 flex-1 pr-4">
                           <p className="text-xs font-bold text-[var(--color-text-primary)] leading-tight group-hover:text-[var(--color-accent)] transition-colors">{log.description}</p>
                           <div className="flex items-center gap-2">
                              <Clock size={10} className="text-[var(--color-text-secondary)]" />
                              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{format(new Date(log.created_at), 'MMM dd, HH:mm')}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-serif font-black italic text-[var(--color-accent)] block">+{log.amount}</span>
                           <p className="text-[7px] font-black uppercase tracking-widest opacity-30 mt-0.5">XP</p>
                        </div>
                     </motion.div>
                   )) : (
                     <div className="col-span-full py-20 text-center space-y-6 opacity-10">
                        <Rocket size={40} className="mx-auto" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Awaiting system input...</p>
                     </div>
                   )}
                 </AnimatePresence>
              </div>
              
              <div className="pt-6 border-t border-[var(--color-border)]">
                 <p className="text-[8px] text-[var(--color-text-secondary)] font-medium text-center italic opacity-60 px-4">
                    "Influence is earned through consistent output."
                 </p>
              </div>
           </div>
        </section>

        {/* ─── RANK DETAIL MODAL ─── */}
        <AnimatePresence>
          {selectedTier && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-10 pointer-events-none">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedTier(null)}
                 className="fixed inset-0 bg-slate-950/70 backdrop-blur-md pointer-events-auto"
               />
               
               <motion.div 
                 layoutId={`tier-card-${selectedTier.name}`}
                 initial={{ opacity: 0, scale: 0.9, y: 100 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 100 }}
                 className="relative w-full max-w-2xl bg-[#000814] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(var(--color-accent-rgb),0.2)] pointer-events-auto z-[10000] max-h-[90vh] flex flex-col"
               >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--color-accent)]/20 to-transparent blur-[60px] opacity-30 pointer-events-none" />
                  
                  <button 
                    onClick={() => setSelectedTier(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/40 transition-all z-20"
                  >
                    <X size={20} />
                  </button>

                  <div className="p-8 md:p-14 overflow-y-auto custom-scrollbar space-y-8 md:space-y-10">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-[1.5rem] md:rounded-[2rem] bg-[var(--color-accent)] text-black flex items-center justify-center shadow-2xl shadow-[var(--color-accent)]/20">
                           <selectedTier.icon size={32} className="md:w-[40px] md:h-[40px]" />
                        </div>
                        <div>
                           <h3 className="text-3xl md:text-5xl font-serif font-black italic text-white leading-none mb-1 md:mb-2">{selectedTier.name}</h3>
                           <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] drop-shadow-sm">{selectedTier.tagline}</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5 pb-2">Technical Benefits & Scaling</h4>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                           <BenefitItem 
                             icon={CreditCard} 
                             label="Transfer Fee" 
                             value={selectedTier.details.fee} 
                             desc="Service charge" 
                           />
                           <BenefitItem 
                             icon={Zap} 
                             label="Purchase Bonus" 
                             value={`${selectedTier.details.bonus}`} 
                             desc="Bonus Creds" 
                           />
                           <BenefitItem 
                             icon={Award} 
                             label="Achv. Boost" 
                             value={`${selectedTier.details.achvBonus}`} 
                             desc="Mission reward" 
                           />
                           <BenefitItem 
                             icon={Send} 
                             label="Intents" 
                             value={selectedTier.details.intents} 
                             desc="Free limit" 
                           />
                           <BenefitItem 
                             icon={Users} 
                             label="Tribes" 
                             value={selectedTier.details.tribes} 
                             desc="Free limit" 
                           />
                           <BenefitItem 
                             icon={CheckCircle2} 
                             label="Access" 
                             value="Global" 
                             desc="Priority status" 
                           />
                        </div>
                     </div>

                     <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 pb-4">
                        <div className="text-center md:text-left">
                           <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">Required Threshold</p>
                           <p className="text-lg md:text-xl font-serif font-black italic text-white">{gamification?.tier === selectedTier.name ? 'Already Achieved' : `Level ${selectedTier.level}`}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedTier(null)}
                          className="w-full md:w-auto px-10 py-4 bg-[var(--color-accent)] text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl font-black"
                        >
                           Acknowledged
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  )
}

function BenefitItem({ icon: Icon, label, value, desc }: any) {
  return (
    <div className="p-3 md:p-5 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5 group hover:border-[var(--color-accent)]/30 transition-all">
       <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="p-1.5 md:p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-[var(--color-accent)] transition-colors">
             <Icon size={14} className="md:w-[16px] md:h-[16px]" />
          </div>
          <span className="text-[11px] md:text-sm font-black text-white">{value}</span>
       </div>
       <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5 md:mb-1 leading-none">{label}</p>
       <p className="text-[7px] md:text-[9px] font-medium text-white/20 leading-tight line-clamp-1">{desc}</p>
    </div>
  )
}
