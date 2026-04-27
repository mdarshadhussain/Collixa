'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Award, ArrowLeft, Trophy, Sparkles, Zap, Star, Shield, Target, Users, MapPin, Globe, CreditCard, Send, Rocket, Clock, Activity, ChevronRight, Compass, Layout, Flame, Eye, TrendingUp, Info, ChevronDown, ChevronUp, X, CheckCircle2, BookOpen } from 'lucide-react'
import Badge from '@/components/Badge'
import AchievementsSection from '@/components/AchievementsSection'
import { useAuth } from '@/app/context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function RewardsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [gamification, setGamification] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showXPDetails, setShowXPDetails] = useState(false)
  const [selectedTier, setSelectedTier] = useState<any>(null)

  useEffect(() => {
    if (token) {
      // Fetch Progress
      fetch(`${API_URL}/api/intents/hub/gamification`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setGamification(data.data)
          setLoading(false)
        })
    }
  }, [token])

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

  return (
    <>
      <div className="max-w-[1400px] mx-auto space-y-12 pb-24 mt-0 px-4 md:px-0">
        
        {/* ─── INTERACTIVE XP HERO ─── */}
        <section className="relative overflow-hidden rounded-[2.5rem] md:rounded-[3rem] bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] p-6 md:p-12 shadow-2xl shadow-black/40 border border-white/5">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--color-accent)]/10 to-transparent rounded-full blur-[120px] opacity-40 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="space-y-6 max-w-2xl text-center lg:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="p-3 bg-[var(--color-accent)] text-black rounded-2xl shadow-[0_0_20px_rgba(255,133,187,0.4)]">
                   <Trophy size={24} />
                </div>
                <h1 className="text-4xl md:text-7xl font-serif font-black tracking-tighter leading-none">
                  The <span className="italic text-[var(--color-accent)]">Ascent Pulse.</span>
                </h1>
              </div>

              <p className="text-sm md:text-lg text-white/60 font-medium max-w-lg leading-relaxed mx-auto lg:mx-0">
                You are currently a <span className="text-white font-black italic">{gamification?.tier || 'Nomad'}</span>. <br className="hidden md:block" /> Every contribution accelerates your evolution.
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
        <section className="space-y-12 py-12">
           <div className="flex flex-col gap-2 px-4 md:px-0">
              <h2 className="text-4xl md:text-7xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">The Ascent Roadmap.</h2>
              <p className="text-[10px] md:text-[12px] text-[var(--color-text-secondary)] font-black uppercase tracking-[0.4em] opacity-50">Journey from collaborator to governance partner</p>
           </div>

           <div className="flex overflow-x-auto pb-8 gap-6 px-4 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 snap-x snap-mandatory scroll-smooth hide-scrollbar">
              {TIERS.map((t, idx) => {
                const isActive = gamification?.tier === t.name;
                
                return (
                  <motion.div 
                    key={t.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedTier(t)}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.15, duration: 0.8 }}
                    className={`group relative p-8 rounded-[3rem] border transition-all duration-700 flex flex-col justify-between min-h-[420px] min-w-[300px] md:min-w-0 overflow-hidden cursor-pointer snap-start flex-shrink-0 ${
                      isActive 
                      ? 'bg-[#021A54] border-[var(--color-accent)] shadow-2xl ring-1 ring-[var(--color-accent)]/30' 
                      : 'bg-[#080C14] border-white/5 hover:border-white/20 hover:bg-[#0C121E] shadow-xl'
                    }`}
                  >
                    <div className={`absolute -bottom-10 -right-10 ${isActive ? 'text-[var(--color-accent)] opacity-10' : 'text-white opacity-[0.03]'} group-hover:opacity-10 transition-opacity duration-700 pointer-events-none select-none`}>
                      <t.icon size={280} strokeWidth={0.5} />
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${isActive ? 'bg-[var(--color-accent)] text-black shadow-[0_0_30px_rgba(255,133,187,0.4)]' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                          <t.icon size={26} />
                       </div>
                       
                       <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                         isActive 
                         ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]' 
                         : 'bg-white/5 border-white/10 text-white/30'
                       }`}>
                          {isActive ? '• Active' : `Level ${t.level}`}
                       </div>
                    </div>

                    <div className="space-y-6 relative z-10 pt-8">
                      <div>
                        <h3 className={`text-4xl md:text-5xl font-serif font-black italic tracking-tighter leading-none mb-3 transition-colors ${isActive ? 'text-white' : 'text-white group-hover:text-[var(--color-accent)]'}`}>
                          {t.name}
                        </h3>
                        <div className="flex items-center gap-2">
                           <div className={`w-4 h-[1px] ${isActive ? 'bg-[var(--color-accent)]' : 'bg-white/20'}`} />
                           <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? 'text-[var(--color-accent)]' : 'text-white/30'}`}>
                             {isActive ? 'Unlocked & Verified' : t.tagline}
                           </p>
                        </div>
                      </div>

                      <ul className="space-y-4 pt-4">
                         {t.benefits.map(b => (
                           <li key={b} className={`flex items-center gap-3 text-[11px] font-bold transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`}>
                              <Sparkles size={10} className={`${isActive ? 'text-[var(--color-accent)]' : 'text-white/20'}`} /> 
                              {b}
                           </li>
                         ))}
                      </ul>
                    </div>

                    <div className="pt-8 flex items-center justify-between relative z-10 mt-auto">
                       <p className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${isActive ? 'text-[var(--color-accent)]' : 'text-white/20 group-hover:text-white/60'}`}>Level Details</p>
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                         isActive 
                         ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]' 
                         : 'bg-white/5 border-white/10 text-white/40 group-hover:border-[var(--color-accent)]/50 group-hover:text-[var(--color-accent)]'
                       }`}>
                          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
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
              <div className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[var(--color-accent)]/10 to-transparent rounded-full blur-[100px] opacity-20 pointer-events-none" />
                <AchievementsSection userId={user.id} />
                
                {/* ─── THE EVOLUTION MANUAL ─── */}
            <div className="space-y-10 bg-[#021A54] border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[var(--color-accent)]/10 to-transparent blur-[120px] opacity-20 pointer-events-none" />
               <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 blur-[100px] opacity-30 pointer-events-none" />
               
               <div className="text-center space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full mb-4">
                     <Zap size={14} className="text-[var(--color-accent)]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Network Protocol v2.0</span>
                  </div>
                  <h2 className="text-4xl md:text-7xl font-serif font-black tracking-tighter text-white uppercase italic leading-none">The Evolution Manual.</h2>
                  <p className="text-[10px] md:text-[14px] text-white/40 font-black uppercase tracking-[0.4em] max-w-2xl mx-auto">Your path to network sovereignty and economic mastery</p>
               </div>

               <div className="grid grid-rows-2 grid-flow-col md:grid-flow-row md:grid-rows-none md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible pb-8 md:pb-0 gap-4 md:gap-6 relative z-10 snap-x snap-mandatory hide-scrollbar">
                  {[
                    { title: "The Master (Teaching)", xp: "250", desc: "Awarded for finalizing a session as a Provider. Validated knowledge transfer is the highest form of influence.", icon: Award },
                    { title: "The Student (Learning)", xp: "100", desc: "Earned for completing a session as a Student. Investing in your human capital builds the foundation of growth.", icon: BookOpen },
                    { title: "The Architect (Intents)", xp: "100", desc: "Awarded for launching a new Intent. Starting projects and gathering collaborators triggers network expansion.", icon: Rocket },
                    { title: "The Elder (Tribes)", xp: "75", desc: "Earned for listing new expertise. Planting the seeds of a new tribe allows the network to find you.", icon: Compass },
                    { title: "The Mentor (Onboarding)", xp: "40", desc: "Awarded for accepting new members into your tribe. Guiding others into the network builds community trust.", icon: Users },
                    { title: "The Critic (Feedback)", xp: "50", desc: "Awarded for providing detailed feedback after a session. Peer reviews strengthen the network's trust layer.", icon: Star },
                    { title: "The Investor (Capital)", xp: "10x", desc: "Earned for purchasing credit packages. Every $1 invested in your account yields 10 XP in reputation power.", icon: CreditCard },
                    { title: "The Scout (Discovery)", xp: "20", desc: "Earned for active engagement and requesting to join tribes. Discovery is the first step of evolution.", icon: Activity },
                    { title: "The Pulse (Daily)", xp: "10", desc: "Awarded for daily network participation. Consistency is the primary driver of reputation growth.", icon: Zap }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-[var(--color-accent)]/30 transition-all group min-w-[180px] md:min-w-0 flex-shrink-0 snap-start"
                    >
                       <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-white/5 flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                          <item.icon size={14} className="md:w-[22px] md:h-[22px] text-[var(--color-accent)]" />
                       </div>
                       <h4 className="text-sm md:text-xl font-serif font-black italic text-white mb-1 md:mb-2 leading-none">{item.title}</h4>
                       <div className="flex items-center gap-1.5 mb-2 md:mb-4">
                          <span className="text-lg md:text-2xl font-serif font-black italic text-[var(--color-accent)]">+{item.xp}</span>
                          <span className="text-[6px] md:text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">XP</span>
                       </div>
                       <p className="text-[9px] md:text-[11px] text-white/40 leading-tight font-medium line-clamp-2 md:line-clamp-3">{item.desc}</p>
                    </motion.div>
                  ))}
               </div>

               <div className="pt-12 border-t border-white/5 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">Strategic Mastery</h5>
                     <ul className="space-y-3">
                        {[
                          "Consistency Over Intensity: Regular contributions yield more influence than sporadic activity.",
                          "Achievement Stacking: Unlock Reputation Milestones for massive one-time XP boosts.",
                          "Quality of Trust: Higher ratings in reviews unlock hidden multipliers in future protocols."
                        ].map((tip, i) => (
                          <li key={i} className="flex items-start gap-3 text-[11px] text-white/60 leading-relaxed">
                             <div className="w-1 h-1 rounded-full bg-[var(--color-accent)] mt-1.5 flex-shrink-0" />
                             {tip}
                          </li>
                        ))}
                     </ul>
                  </div>
                  <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 flex flex-col justify-center text-center">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Current Philosophy</p>
                     <p className="text-xl font-serif italic text-white font-black leading-tight">"In the network economy, your reputation is the only currency that cannot be devalued."</p>
                  </div>
               </div>
            </div>
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
                 className="relative w-full max-w-2xl bg-[#021A54] border-t sm:border border-white/20 rounded-t-[3.5rem] sm:rounded-[4rem] overflow-hidden shadow-[0_0_120px_rgba(255,133,187,0.15)] pointer-events-auto z-[10000] max-h-[90vh] flex flex-col"
               >
                  {/* Creative Background Elements */}
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--color-accent)]/20 to-transparent blur-[120px] opacity-20 pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 blur-[100px] opacity-30 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
                     <selectedTier.icon size={400} strokeWidth={0.5} />
                  </div>
                  
                  <button 
                    onClick={() => setSelectedTier(null)}
                    className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
                  >
                    <X size={24} />
                  </button>

                  <div className="p-10 md:p-16 overflow-y-auto custom-scrollbar space-y-10 md:space-y-12 relative z-10">
                     <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="relative group">
                           <div className="absolute inset-0 bg-[var(--color-accent)] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                           <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-[2.5rem] md:rounded-[3rem] bg-[var(--color-accent)] text-black flex items-center justify-center shadow-[0_20px_50px_rgba(255,133,187,0.3)] relative z-10">
                              <selectedTier.icon size={48} className="md:w-[64px] md:h-[64px]" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-5xl md:text-7xl font-serif font-black italic text-white leading-none tracking-tighter">{selectedTier.name}</h3>
                           <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] brightness-110">{selectedTier.tagline}</p>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="flex items-center gap-4">
                           <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 whitespace-nowrap">Technical Benefits & Scaling</h4>
                           <div className="w-full h-[1px] bg-white/5" />
                        </div>
                        
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
    <div className="p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white/5 border border-white/5 group hover:border-[var(--color-accent)]/30 hover:bg-white/[0.08] transition-all relative overflow-hidden">
       <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--color-accent)]/5 to-transparent blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity" />
       
       <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="p-3 md:p-4 rounded-2xl bg-white/5 text-white/40 group-hover:text-[var(--color-accent)] group-hover:scale-110 transition-all duration-500">
             <Icon size={20} className="md:w-[24px] md:h-[24px]" />
          </div>
          <span className="text-xl md:text-2xl font-serif font-black italic text-white tracking-tighter">{value}</span>
       </div>
       <div className="space-y-1">
          <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] leading-none">{label}</p>
          <p className="text-[8px] md:text-[10px] font-medium text-white/20 leading-relaxed group-hover:text-white/40 transition-colors">{desc}</p>
       </div>
    </div>
  )
}
