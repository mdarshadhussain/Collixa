'use client'

import { useState, useEffect } from 'react'
import { Award, Lock, Star, Footprints, Lightbulb, Crown, Users, Target, Trophy, Wrench, Briefcase, MessageSquare, Megaphone, Share2, PiggyBank, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Icon mapping for achievement icons
const iconMap: { [key: string]: React.ElementType } = {
  Footprints,
  Lightbulb,
  Crown,
  Star,
  Handshake: Users,
  Target,
  Trophy,
  Wrench,
  Toolbox: Briefcase,
  MessageSquare,
  Megaphone,
  Share2,
  PiggyBank,
  Award
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

  useEffect(() => {
    fetchAchievements()
  }, [userId])

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
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

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = []
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--color-text-secondary)]">
        <p>{error}</p>
      </div>
    )
  }

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalRewards = achievements
    .filter(a => a.isUnlocked)
    .reduce((sum, a) => sum + a.reward, 0)

  // For summary mode, pick the top 4 "important" achievements:
  // 1. SKIP UNLOCKED (User only wants to see what's left)
  // 2. SKIP 100% COMPLETE (Even if not technically "unlocked" yet)
  // 3. Highest progress toward unlocking
  const displayAchievements = variant === 'summary' 
    ? [...achievements]
        .filter(a => {
           const isComplete = (a.progress || 0) >= (a.requirement || 1)
           return !a.isUnlocked && !isComplete
        })
        .sort((a, b) => {
          const progressA = (a.progress || 0) / (a.requirement || 1)
          const progressB = (b.progress || 0) / (b.requirement || 1)
          return progressB - progressA
        })
        .slice(0, 4)
    : achievements

  if (variant === 'summary') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayAchievements.map((achievement) => {
          const isImage = achievement.icon.endsWith('.png') || achievement.icon.endsWith('.webp')
          const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100)
          
          return (
            <div
              key={achievement.id}
              className={`group relative flex flex-col bg-white rounded-[2rem] overflow-hidden border-0 transition-all duration-700 cursor-pointer ${
                achievement.isUnlocked 
                  ? 'hover:shadow-2xl shadow-xl shadow-black/5' 
                  : 'opacity-80'
              }`}
            >
              {/* Card Image Header */}
              <div className="aspect-[4/3] bg-[var(--color-bg-secondary)] overflow-hidden relative">
                {isImage ? (
                  <img 
                    src={`/images/achievements/${achievement.icon}`} 
                    alt={achievement.name} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/10 font-serif text-2xl font-black italic bg-[var(--color-bg-secondary)]">
                    {achievement.name.split(' ')[0]}
                  </div>
                )}
                
                {/* Category Badge Overlay */}
                <div className="absolute top-4 left-4">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-full border border-white/10">
                    {categoryLabels[achievement.category] || achievement.category}
                  </span>
                </div>

                {!achievement.isUnlocked && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity group-hover:opacity-0">
                    <Lock size={24} className="text-white/60" />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                   <div className="flex justify-between items-start gap-2 mb-2">
                      <h5 className="font-serif font-black text-[var(--color-text-primary)] text-lg leading-tight group-hover:text-[var(--color-accent)] transition-colors">
                        {achievement.name}
                      </h5>
                      {achievement.isUnlocked && <ArrowUpRight size={16} className="text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />}
                   </div>
                   <p className="text-[10px] text-[var(--color-text-secondary)] font-medium leading-relaxed line-clamp-2">
                     {achievement.description}
                   </p>
                </div>

                <div className="mt-4 space-y-3">
                   {/* Reward & Unlocked State */}
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-accent-soft)]/20 rounded-full">
                         <Star size={10} className="text-[var(--color-accent)] fill-[var(--color-accent)]" />
                         <span className="text-[9px] font-black tracking-wide text-[var(--color-accent)]">+{achievement.reward} CR</span>
                      </div>
                      {achievement.isUnlocked && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">Unlocked</span>
                      )}
                   </div>

                   {/* Progress bar for locked achievements */}
                   {!achievement.isUnlocked && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                          <span>Progress</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-1 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                   )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white rounded-3xl p-6 border border-[var(--color-border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
               <Award size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Unlocked</p>
               <p className="text-2xl font-black text-[var(--color-text-primary)]">
                  {unlockedCount} <span className="text-sm font-normal text-[var(--color-text-secondary)]">/ {achievements.length}</span>
               </p>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-6 border border-[var(--color-border)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
               <Star size={24} fill="currentColor" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Total Earned</p>
               <p className="text-2xl font-black text-[var(--color-text-primary)]">+{totalRewards} <span className="text-xs font-normal">Credits</span></p>
            </div>
         </div>
      </div>

      {/* Achievement Categories */}
      {Object.entries(groupedAchievements).map(([category, items]) => (
        <div key={category} className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)]">
               {categoryLabels[category] || category}
             </h4>
             <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {items.map((achievement) => {
              const isImage = achievement.icon.endsWith('.png') || achievement.icon.endsWith('.webp')
              const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100)

              return (
                <div
                  key={achievement.id}
                  className={`group relative flex bg-white rounded-[3rem] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all duration-700 hover:shadow-2xl cursor-pointer ${
                    !achievement.isUnlocked && 'opacity-80'
                  }`}
                >
                  <div className="flex items-stretch w-full">
                    {/* Square Image Side */}
                    <div className="w-40 bg-[var(--color-bg-secondary)] overflow-hidden relative shrink-0">
                      {isImage ? (
                        <img 
                          src={`/images/achievements/${achievement.icon}`} 
                          alt={achievement.name} 
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/10 font-serif text-3xl font-black italic">ACH</div>
                      )}
                      {!achievement.isUnlocked && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                           <Lock size={20} className="text-white/50" />
                        </div>
                      )}
                    </div>

                    {/* Content Side */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                       <div>
                         <div className="flex justify-between items-start mb-2">
                           <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] opacity-60">
                             {categoryLabels[achievement.category] || achievement.category}
                           </span>
                           {achievement.isUnlocked && (
                             <Badge variant="sage" className="text-[8px] font-black bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)]">Unlocked</Badge>
                           )}
                         </div>
                         <h5 className="font-serif font-black text-[var(--color-text-primary)] text-lg leading-tight mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                           {achievement.name}
                         </h5>
                         <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                           {achievement.description}
                         </p>
                       </div>

                       <div className="mt-4">
                          {!achievement.isUnlocked ? (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-40">
                                <span>Progress</span>
                                <span>{Math.round(progressPercent)}%</span>
                              </div>
                              <div className="h-1 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                               <Star size={10} className="text-[var(--color-accent)] fill-[var(--color-accent)]" />
                               <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)]">+{achievement.reward} Credits Rewarded</span>
                            </div>
                          )}
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
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          <Award size={48} className="mx-auto mb-4 opacity-50" />
          <p>No achievements available yet.</p>
        </div>
      )}
    </div>
  )
}
