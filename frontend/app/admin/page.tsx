'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Users, Briefcase, Star, Calendar, Coins, TrendingUp, Activity, ShieldAlert, Award } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface DashboardStats {
  totalUsers: number
  totalIntents: number
  totalTribes: number
  totalSessions: number
  totalCredits: number
  totalAchievements: number
  activeUsers: number
  newUsersToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        cache: 'no-store',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      } else {
        const errData = await response.json().catch(() => ({}))
        console.error('Failed to fetch admin stats:', errData.error || response.statusText)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = [
    { name: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { name: 'Total Intents', value: stats?.totalIntents || 0, icon: Briefcase, color: 'bg-emerald-500' },
    { name: 'Total Tribes', value: stats?.totalTribes || 0, icon: Star, color: 'bg-purple-500' },
    { name: 'Active Sessions', value: stats?.totalSessions || 0, icon: Calendar, color: 'bg-orange-500' },
    { name: 'Total Credits', value: stats?.totalCredits || 0, icon: Coins, color: 'bg-amber-500' },
    { name: 'Earned Awards', value: stats?.totalAchievements || 0, icon: Award, color: 'bg-indigo-500' },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-bg-secondary)]/10 mb-4" />
              <div className="h-8 w-24 bg-[var(--color-bg-secondary)]/10 rounded mb-2" />
              <div className="h-4 w-16 bg-[var(--color-bg-secondary)]/10 rounded" />
            </div>
          ))}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome */}
        <div className="px-1 overflow-hidden">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-black text-[var(--color-text-primary)] leading-tight">
            Welcome to <span className="text-[var(--color-accent)]">Admin Dashboard</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm mt-2 max-w-xl">
            Manage users, intents, tribes, and monitor platform activity in real-time.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className="bg-[var(--color-bg-secondary)] rounded-2xl p-5 sm:p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className="text-white sm:w-6 sm:h-6" />
                </div>
                <p className="text-[var(--color-text-secondary)] text-[10px] sm:text-xs font-black uppercase tracking-widest">{stat.name}</p>
                <p className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-5 sm:p-6 border border-[var(--color-border)]">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-[var(--color-text-primary)] mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              { href: '/admin/approvals', label: 'Approvals', color: 'bg-amber-500', icon: ShieldAlert },
              { href: '/admin/users', label: 'Manage Users', color: 'bg-[var(--color-accent)]', icon: Users },
              { href: '/admin/credits', label: 'Manage Wallet', color: 'bg-[var(--color-accent)]', icon: Coins },
              { href: '/admin/achievements', label: 'Achievements', color: 'bg-[var(--color-accent)]', icon: Award },
              { href: '/admin/intents', label: 'Manage Intents', color: 'bg-[var(--color-accent)]', icon: Briefcase },
              { href: '/admin/tribes', label: 'Manage Tribes', color: 'bg-[var(--color-accent)]', icon: Star },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className={`px-3 py-2 sm:px-4 sm:py-2.5 ${action.color} text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center gap-2`}
                >
                  {ActionIcon && <ActionIcon size={14} />}
                  {action.label}
                </a>
              )
            })}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-5 sm:p-6 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={18} className="text-[var(--color-accent)]" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-widest text-[var(--color-text-primary)]">System Status</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">All systems operational</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
