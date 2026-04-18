'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Calendar, CheckCircle, XCircle, Search, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Session {
  id: string
  status: string
  scheduled_at: string
  duration: number
  notes: string
  skill: {
    name: string
  }
  learner: {
    name: string
    email: string
  }
  teacher: {
    name: string
    email: string
  }
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/sessions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data.data)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const endpoint = status === 'COMPLETED' ? 'complete' : 'cancel'
      const response = await fetch(`${API_URL}/api/admin/sessions/${sessionId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        setSessions(sessions.map(s => s.id === sessionId ? { ...s, status } : s))
      }
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const filteredSessions = sessions.filter(session =>
    session.skill?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.learner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-[var(--color-bg-secondary)]/10 rounded w-1/4" />
          <div className="h-64 bg-[var(--color-bg-secondary)]/10 rounded" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-serif font-black text-[var(--color-text-primary)]">Session Management</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Manage all platform sessions</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Skill</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Learner</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Teacher</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Status</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Scheduled</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-[var(--color-bg-secondary)]/5">
                  <td className="px-6 py-4">
                    <span className="font-medium text-[var(--color-text-primary)]">{session.skill?.name || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{session.learner?.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{session.learner?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{session.teacher?.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{session.teacher?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      session.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                      session.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500' :
                      session.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                    {new Date(session.scheduled_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {session.status === 'PENDING' || session.status === 'CONFIRMED' ? (
                        <>
                          <button
                            onClick={() => updateSessionStatus(session.id, 'COMPLETED')}
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                            title="Mark as completed"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => updateSessionStatus(session.id, 'CANCELLED')}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Cancel session"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-[var(--color-text-secondary)]">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSessions.length === 0 && (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-[var(--color-text-secondary)] mb-4" />
              <p className="text-[var(--color-text-secondary)]">No sessions found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
