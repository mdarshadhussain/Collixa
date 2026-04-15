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
    sessions: 'Collaboration',
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
          const Icon = iconMap[achievement.icon] || Award
          const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100)
          
          return (
            <div
              key={achievement.id}
              className={`group relative p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden ${
                achievement.isUnlocked
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/15'
                  : 'bg-white/5 border-[var(--color-border)] hover:bg-white/10'
              }`}
            >
              <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${
                  achievement.isUnlocked
                    ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                }`}>
                  {achievement.isUnlocked ? <Icon size={24} /> : <Lock size={20} className="opacity-40" />}
                </div>
                
                <div>
                  <h5 className="font-serif font-black text-[var(--color-text-primary)] text-lg leading-tight mb-1 truncate">
                    {achievement.name}
                  </h5>
                  <p className="text-[10px] text-[var(--color-text-secondary)] font-medium leading-relaxed line-clamp-2 min-h-[30px]">
                    {achievement.description}
                  </p>
                </div>

                {!achievement.isUnlocked && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Progress</span>
                      <span className="text-[9px] font-bold text-[var(--color-accent)]">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-1 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-[var(--color-accent)]" />
                    <span className="text-[10px] font-black tracking-wide text-[var(--color-accent)]">+{achievement.reward} CR</span>
                  </div>
                  {achievement.isUnlocked && (
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 italic">Unlocked</span>
                  )}
                </div>
              </div>
              
              {/* Background Glow for unlocked */}
              {achievement.isUnlocked && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100 opacity-50" />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-[var(--color-accent)]/10 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">Achievements Unlocked</p>
          <p className="text-2xl font-black text-[var(--color-text-primary)]">
            {unlockedCount} <span className="text-sm font-normal text-[var(--color-text-secondary)]">/ {achievements.length}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">Credits Earned</p>
          <p className="text-2xl font-black text-[var(--color-text-primary)]">+{totalRewards}</p>
        </div>
      </div>

      {/* Achievement Categories */}
      {Object.entries(groupedAchievements).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-3">
            {categoryLabels[category] || category}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((achievement) => {
              const Icon = iconMap[achievement.icon] || Award
              const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100)

              return (
                <div
                  key={achievement.id}
                  className={`group relative p-8 rounded-[3rem] border transition-all duration-700 overflow-hidden ${
                    achievement.isUnlocked
                      ? 'bg-[var(--color-accent)]/15 border-[var(--color-accent)]/50 shadow-xl shadow-[var(--color-accent)]/5'
                      : 'bg-black/10 border-[var(--color-border)] opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:rotate-12 ${
                      achievement.isUnlocked
                        ? 'bg-[var(--color-accent)] text-white shadow-xl shadow-[var(--color-accent)]/20'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                    }`}>
                      {achievement.isUnlocked ? (
                        <Icon size={28} />
                      ) : (
                        <Lock size={24} className="opacity-40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-serif font-black text-[var(--color-text-primary)] text-base leading-tight mb-2 truncate">
                        {achievement.name}
                      </h5>
                      <p className="text-xs text-[var(--color-text-primary)] opacity-60 mt-0.5 leading-relaxed font-medium">
                        {achievement.description}
                      </p>

                      {/* Progress bar for locked achievements */}
                      {!achievement.isUnlocked && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                            {achievement.progress} / {achievement.requirement}
                          </p>
                        </div>
                      )}

                      {/* Reward badge */}
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-[var(--color-accent)]">
                          +{achievement.reward} credits
                        </span>
                        {achievement.isUnlocked && achievement.unlockedAt && (
                          <span className="text-[10px] text-[var(--color-text-secondary)] ml-auto">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
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
