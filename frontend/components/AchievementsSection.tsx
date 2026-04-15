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
}

export default function AchievementsSection({ userId }: AchievementsSectionProps) {
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
                  className={`relative p-4 rounded-xl border transition-all ${
                    achievement.isUnlocked
                      ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30'
                      : 'bg-[var(--color-bg-primary)] border-[var(--color-border)] opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      achievement.isUnlocked
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                    }`}>
                      {achievement.isUnlocked ? (
                        <Icon size={20} />
                      ) : (
                        <Lock size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-[var(--color-text-primary)] text-sm truncate">
                        {achievement.name}
                      </h5>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
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
