'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Users, Briefcase, Star, Calendar, Coins, TrendingUp, Activity } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface DashboardStats {
  totalUsers: number
  totalIntents: number
  totalTribes: number
  totalSessions: number
  totalCredits: number
  activeUsers: number
  newUsersToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
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
    { name: 'New Users Today', value: stats?.newUsersToday || 0, icon: TrendingUp, color: 'bg-pink-500' },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-white/10 mb-4" />
              <div className="h-8 w-24 bg-white/10 rounded mb-2" />
              <div className="h-4 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-3xl font-serif font-black text-[var(--color-text-primary)]">
            Welcome to <span className="text-[var(--color-accent)]">Admin Dashboard</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Manage users, intents, tribes, and monitor platform activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} className="text-white" />
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm font-medium">{stat.name}</p>
                <p className="text-3xl font-black text-[var(--color-text-primary)] mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/users"
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-accent)]/80 transition-all"
            >
              Manage Users
            </a>
            <a
              href="/admin/intents"
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-accent)]/80 transition-all"
            >
              Manage Intents
            </a>
            <a
              href="/admin/tribes"
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-accent)]/80 transition-all"
            >
              Manage Tribes
            </a>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={20} className="text-[var(--color-accent)]" />
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">System Status</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-[var(--color-text-secondary)]">All systems operational</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
