'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Award, Users, Trophy, TrendingUp, Search } from 'lucide-react'
import { motion } from 'framer-motion'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface AchievementStat {
  id: string
  name: string
  description: string
  category: string
  requirement: number
  reward: number
  totalUnlocks: number
}

export default function AdminAchievementsPage() {
  const [stats, setStats] = useState<AchievementStat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats/achievements`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching achievement stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStats = stats.filter(stat => 
    stat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stat.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalUnlocks = stats.reduce((sum, s) => sum + s.totalUnlocks, 0)
  const topAchievement = [...stats].sort((a, b) => b.totalUnlocks - a.totalUnlocks)[0]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif font-black text-[var(--color-text-primary)]">
              Achievement <span className="text-[var(--color-accent)]">Analytics</span>
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Monitor platform engagement and milestone distribution.
            </p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
            <input 
              type="text"
              placeholder="Filter by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none transition-all w-full md:w-80 text-sm"
            />
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
              <Trophy size={20} className="text-purple-500" />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">Total Rewards Issued</p>
            <p className="text-2xl font-black text-[var(--color-text-primary)] mt-1">
              {totalUnlocks.toLocaleString()}
            </p>
          </div>

          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Award size={20} className="text-amber-500" />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">Most Earned</p>
            <p className="text-2xl font-black text-[var(--color-text-primary)] mt-1">
              {topAchievement ? topAchievement.name : 'N/A'}
            </p>
          </div>

          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm font-medium">Unique Trophies</p>
            <p className="text-2xl font-black text-[var(--color-text-primary)] mt-1">
              {stats.length}
            </p>
          </div>
        </div>

        {/* Stats Table */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 border-b border-[var(--color-border)]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Achievement</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Target</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Bounty</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] text-right">Total Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8">
                        <div className="h-4 bg-white/5 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredStats.length > 0 ? (
                  filteredStats.map((stat) => (
                    <tr key={stat.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">{stat.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{stat.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-[var(--color-border)]">
                          {stat.category}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-[var(--color-text-secondary)]">
                        {stat.requirement} req.
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-emerald-500">
                        +{stat.reward} CR
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-[var(--color-text-primary)]">
                            {stat.totalUnlocks.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-tighter">
                            Users Unlocked
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-secondary)] italic">
                      No achievements matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
