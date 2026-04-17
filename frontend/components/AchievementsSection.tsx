'use client'

import { useState, useEffect } from 'react'
import { Award, Lock, Star, Footprints, Lightbulb, Crown, Users, Target, Trophy, Wrench, Briefcase, MessageSquare, Megaphone, Share2, PiggyBank, Loader2, ArrowUpRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '@/components/Badge'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const iconMap: { [key: string]: React.ElementType } = {
  Footprints, Lightbulb, Crown, Star, Handshake: Users, Target,
  Trophy, Wrench, Toolbox: Briefcase, MessageSquare, Megaphone,
  Share2, PiggyBank, Award
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: number
  reward: number
  category: string
  progress: number
  isUnlocked: boolean
  unlockedAt: string | null
}

interface AchievementsSectionProps {
  userId?: string
  variant?: 'full' | 'summary'
}

export default function AchievementsSection({ userId, variant = 'full' }: AchievementsSectionProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    fetchAchievements()
  }, [userId])

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      })

      if (response.ok) {
        const data = await response.json()
        setAchievements(data.data)
      } else {
        setError('Failed to load achievements')
      }
    } catch (err) {
      setError('Failed to load achievements')
    } finally {
      setLoading(false)
    }
  }

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) acc[achievement.category] = []
    acc[achievement.category].push(achievement)
    return acc
  }, {} as { [key: string]: Achievement[] })

  const categoryLabels: { [key: string]: string } = {
    intents: 'Intent Mastery',
    sessions: 'Intent Sessions',
    skills: 'Skill Sharing',
    social: 'Community',
    credits: 'Credit Economy'
  }

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-[var(--color-accent)]" /></div>
  if (error) return <div className="text-center py-8 text-[var(--color-text-secondary)]"><p>{error}</p></div>

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalRewards = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.reward, 0)

  return (
    <div className="space-y-12 pb-24">
      {/* ─── SUMMARY HERO ─── */}
      {variant === 'full' && (
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-[var(--color-bg-secondary)] rounded-[2rem] p-6 sm:p-8 border border-[var(--color-border)] shadow-lg shadow-black/5 flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] border border-[var(--color-accent)]/20 shadow-inner">
                 <Award size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Destinies Manifested</p>
                 <p className="text-3xl font-black text-[var(--color-text-primary)] mt-1">
                    {unlockedCount} <span className="text-base font-normal text-[var(--color-text-secondary)] opacity-50">/ {achievements.length}</span>
                 </p>
              </div>
           </div>
           <div className="bg-[var(--color-bg-secondary)] rounded-[2rem] p-6 sm:p-8 border border-[var(--color-border)] shadow-lg shadow-black/5 flex items-center gap-6">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-inner">
                 <Star size={24} fill="currentColor" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Global Credits Found</p>
                 <p className="text-3xl font-black text-[var(--color-text-primary)] mt-1">+{totalRewards}</p>
              </div>
           </div>
        </div>
      )}

      {/* ─── ROADMAP TIMELINE ─── */}
      <div className="relative max-w-4xl mx-auto py-12 md:py-24">
         {/* Glowing Spine */}
         <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[var(--color-border)] to-transparent rounded-full md:-translate-x-1/2 shadow-[0_0_15px_rgba(255,255,255,0.05)]" />

         {Object.entries(groupedAchievements).map(([category, items], catIndex) => (
           <div key={category} className="mb-24 md:mb-32 relative space-y-8 md:space-y-12">
              {/* Category Checkpoint Node */}
              <div className="flex items-center justify-start md:justify-center sticky top-24 z-20">
                 <div className="bg-[var(--color-bg-primary)] border border-[var(--color-accent)] px-8 py-3 rounded-full shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.15)] flex items-center gap-3 backdrop-blur-md relative ml-[4px] md:ml-0 translate-x-0">
                    <Crown size={16} className="text-[var(--color-accent)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-primary)] drop-shadow-sm">
                      {categoryLabels[category] || category}
                    </span>
                 </div>
              </div>

              <div className="space-y-4 md:space-y-0 relative z-10 w-full">
                 {items.map((achievement, i) => {
                   const isLeft = i % 2 === 0
                   // Extract icon safely without ext
                   const baseIcon = achievement.icon.split('.')[0]
                   const Icon = iconMap[baseIcon] || Target
                   const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100)
                   const isUnlocked = achievement.isUnlocked
                   
                   return (
                      <div key={achievement.id} className="relative flex items-center py-4 md:py-8 w-full group">
                         {/* The Visual Node Marker (Center point on line) */}
                         <div 
                           className={`absolute left-6 md:left-1/2 w-14 h-14 -translate-x-1/2 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 z-20 cursor-pointer 
                            ${isUnlocked 
                               ? 'bg-[var(--color-bg-primary)] border-[var(--color-accent)] shadow-[0_0_40px_rgba(var(--color-accent-rgb),0.4)] md:group-hover:scale-110' 
                               : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] opacity-80 md:group-hover:border-[var(--color-accent)] md:group-hover:opacity-100 md:group-hover:scale-105'
                            }`}
                           onClick={() => setSelectedAchievement(achievement)}
                         >
                            {isUnlocked ? (
                              <Icon size={20} className="text-[var(--color-accent)] drop-shadow-lg" />
                            ) : (
                              <Lock size={16} className="text-[var(--color-text-secondary)] opacity-50" />
                            )}
                         </div>

                         {/* Interactive Details Card */}
                         <div className={`w-full pl-[5rem] md:pl-0 md:w-1/2 flex cursor-pointer ${isLeft ? 'md:pr-16 md:justify-end' : 'md:ml-auto md:pl-16 md:justify-start'}`}>
                            <div 
                              onClick={() => setSelectedAchievement(achievement)}
                              className={`p-5 md:p-6 rounded-[2rem] transition-all duration-500 w-full md:max-w-[340px] border 
                              ${isUnlocked 
                                ? 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)] shadow-xl hover:shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.1)]' 
                                : 'bg-transparent border-transparent hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border)] opacity-60 hover:opacity-100'
                              }`}
                            >
                              <div className="flex flex-col space-y-3">
                                 <div className="flex justify-between items-start gap-3">
                                    <h5 className={`font-serif font-black text-xl leading-tight transition-colors ${isUnlocked ? 'text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`}>
                                      {achievement.name}
                                    </h5>
                                    {isUnlocked && <ArrowUpRight size={16} className="text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                                 </div>
                                 <p className="text-[11px] font-medium text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                                   {achievement.description}
                                 </p>
                                 <div className="pt-2 flex items-center justify-between">
                                    {isUnlocked ? (
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent-soft)]/20 rounded-full">
                                        <Star size={10} className="text-[var(--color-accent)] fill-[var(--color-accent)]" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)]">+{achievement.reward} CR</span>
                                      </div>
                                    ) : (
                                       <div className="w-full space-y-1.5">
                                         <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-60">
                                           <span>Progress</span>
                                           <span>{Math.round(progressPercent)}%</span>
                                         </div>
                                         <div className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                                           <div className="h-full bg-[var(--color-accent)] rounded-full opacity-40 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                                         </div>
                                       </div>
                                    )}
                                 </div>
                              </div>
                            </div>
                         </div>
                      </div>
                   )
                 })}
              </div>
           </div>
         ))}

         {achievements.length === 0 && (
           <div className="text-center py-24 text-[var(--color-text-secondary)] relative z-10 border border-[var(--color-border)] bg-[var(--color-bg-secondary)] rounded-[3rem] shadow-xl">
             <Award size={48} className="mx-auto mb-6 opacity-20" />
             <p className="font-serif italic text-xl">The map is unchartered. No achievements to display.</p>
           </div>
         )}
      </div>

      {/* ─── MODAL (INTERACTIVE DISCOVERY) ─── */}
      <AnimatePresence>
         {selectedAchievement && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
             onClick={() => setSelectedAchievement(null)}
           >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                  {/* Image/Art Cover */}
                  <div className="aspect-[16/10] bg-[var(--color-bg-primary)] relative overflow-hidden flex items-center justify-center group">
                     {selectedAchievement.icon.includes('.png') || selectedAchievement.icon.includes('.webp') ? (
                        <img 
                          src={`/images/achievements/${selectedAchievement.icon}`} 
                          alt={selectedAchievement.name} 
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${!selectedAchievement.isUnlocked && 'grayscale opacity-40'}`}
                        />
                     ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent flex items-center justify-center">
                           <Target size={64} className="text-[var(--color-accent)] opacity-20" />
                        </div>
                     )}

                     {!selectedAchievement.isUnlocked && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                           <div className="bg-black/50 p-4 rounded-full border border-white/10 backdrop-blur-md text-white/80">
                             <Lock size={24} />
                           </div>
                        </div>
                     )}

                     <button 
                       onClick={() => setSelectedAchievement(null)}
                       className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:bg-black/60 transition-colors border border-white/10"
                     >
                        <X size={16} />
                     </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 md:p-10 text-center space-y-6">
                     <div className="space-y-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-bg-primary)] rounded-full border border-[var(--color-border)] text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)]">
                          {categoryLabels[selectedAchievement.category] || selectedAchievement.category}
                        </span>
                        <h2 className="text-3xl font-serif font-black text-[var(--color-text-primary)] tracking-tight">
                          {selectedAchievement.name}
                        </h2>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed font-medium">
                          {selectedAchievement.description}
                        </p>
                     </div>

                     <div className="pt-6 border-t border-[var(--color-border)] w-full">
                        {selectedAchievement.isUnlocked ? (
                           <div className="bg-[var(--color-accent-soft)]/10 border border-[var(--color-accent)]/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2">
                             <div className="flex items-center gap-3 text-[var(--color-accent)]">
                               <Star size={24} fill="currentColor" />
                               <span className="text-3xl font-black tabular-nums translate-y-px">+{selectedAchievement.reward}</span>
                             </div>
                             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] opacity-80">Credits Awarded</p>
                           </div>
                        ) : (
                           <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl p-6">
                              <div className="flex justify-between items-end mb-3">
                                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Requirement Unmet</p>
                                 <p className="text-xl font-black text-[var(--color-text-primary)]">
                                   {selectedAchievement.progress} <span className="text-[10px] text-[var(--color-text-secondary)]">/ {selectedAchievement.requirement}</span>
                                 </p>
                              </div>
                              <div className="h-2 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden shadow-inner">
                                <div 
                                   className="h-full bg-[var(--color-text-secondary)] opacity-40 rounded-full" 
                                   style={{ width: `${Math.min(100, (selectedAchievement.progress / selectedAchievement.requirement) * 100)}%` }} 
                                />
                              </div>
                              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] flex items-center justify-center gap-1 opacity-50">
                                <Lock size={12} /> Reward Locked
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  )
}
