'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Star, Trash2, Search, MapPin, DollarSign } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Tribe {
  id: string
  name: string
  description: string
  category: string
  hourly_rate: number
  created_at: string
  user: {
    name: string
    email: string
  }
}

export default function AdminTribes() {
  const [tribes, setTribes] = useState<Tribe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchTribes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tribes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTribes(data.data)
      }
    } catch (error) {
      console.error('Error fetching tribes:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteTribe = async (tribeId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/tribes/${tribeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        setTribes(tribes.filter(t => t.id !== tribeId))
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting tribe:', error)
    }
  }

  useEffect(() => {
    fetchTribes()
  }, [])

  const filteredTribes = tribes.filter(tribe =>
    tribe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tribe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tribe.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/10 rounded w-1/4" />
          <div className="h-64 bg-white/10 rounded" />
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
            <h2 className="text-2xl font-serif font-black text-[var(--color-text-primary)]">Tribe Management</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Manage all platform tribes/skills</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search tribes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Tribes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTribes.map((tribe) => (
            <div
              key={tribe.id}
              className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs font-bold uppercase">
                    {tribe.category || 'General'}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mt-2">{tribe.name}</h3>
                </div>
                <button
                  onClick={() => setDeleteConfirm(tribe.id)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete tribe"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">
                {tribe.description || 'No description'}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-xs">
                  <DollarSign size={12} />
                  {tribe.hourly_rate || 0} credits/hr
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {tribe.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{tribe.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{tribe.user?.email}</p>
                  </div>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {new Date(tribe.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredTribes.length === 0 && (
          <div className="text-center py-12 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)]">
            <Star size={48} className="mx-auto text-[var(--color-text-secondary)] mb-4" />
            <p className="text-[var(--color-text-secondary)]">No tribes found</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Confirm Delete</h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Are you sure you want to delete this tribe? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-white/5 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTribe(deleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
