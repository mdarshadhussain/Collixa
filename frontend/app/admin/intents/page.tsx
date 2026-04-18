'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Briefcase, Trash2, Search, MapPin, Edit2, X, Check } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Intent {
  id: string
  title: string
  description: string
  category: string
  location: string
  status: string
  created_at: string
  created_by: {
    name: string
    email: string
  }
}

const CATEGORIES = ['Intents', 'Study', 'Fitness', 'Travel', 'Events', 'Startup', 'Networking', 'Creative', 'Social', 'Other']
const STATUSES = ['pending', 'looking', 'active', 'completed', 'cancelled', 'rejected']

export default function AdminIntents() {
  const [intents, setIntents] = useState<Intent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingIntent, setEditingIntent] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Intent>>({})
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchIntents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/intents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIntents(data.data)
      }
    } catch (error) {
      console.error('Error fetching intents:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteIntent = async (intentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/intents/${intentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        setIntents(intents.filter(i => i.id !== intentId))
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting intent:', error)
    }
  }

  const approveIntent = async (intentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/intents/${intentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status: 'looking' })
      })
      if (response.ok) {
        fetchIntents()
      }
    } catch(err) {}
  }

  const rejectIntent = async () => {
    if(!rejectingId || !rejectReason.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/intents/${rejectingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ status: 'rejected', rejection_reason: rejectReason })
      })
      if (response.ok) {
        fetchIntents()
        setRejectingId(null)
        setRejectReason('')
      }
    } catch(err) {}
  }

  const startEdit = (intent: Intent) => {
    setEditingIntent(intent.id)
    setEditForm({
      title: intent.title,
      description: intent.description,
      category: intent.category,
      location: intent.location,
      status: intent.status
    })
  }

  const cancelEdit = () => {
    setEditingIntent(null)
    setEditForm({})
  }

  const saveEdit = async (intentId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/intents/${intentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        setIntents(intents.map(i => i.id === intentId ? { ...i, ...data.data } : i))
        setEditingIntent(null)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating intent:', error)
    }
  }

  useEffect(() => {
    fetchIntents()
  }, [])

  const filteredIntents = intents.filter(intent =>
    intent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intent.created_by?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingIntents = filteredIntents.filter(i => i.status === 'pending')
  const existingIntents = filteredIntents.filter(i => i.status !== 'pending')

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
            <h2 className="text-2xl font-serif font-black text-[var(--color-text-primary)]">Intent Management</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Manage all platform intents</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search intents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Pending Requests Section */}
        {pendingIntents.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xl font-bold font-serif mb-4 flex items-center gap-3">
              Pending Requests <span className="bg-amber-500/20 text-amber-500 text-xs px-3 py-1 rounded-full">{pendingIntents.length}</span>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingIntents.map(intent => (
                <div key={intent.id} className="bg-amber-500/5 rounded-2xl p-6 border border-amber-500/20">
                  <h4 className="font-bold text-lg mb-2">{intent.title}</h4>
                  <p className="text-sm opacity-70 mb-4">{intent.description}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] mb-4">By: {intent.created_by?.name || 'Unknown'}</p>
                  <div className="flex gap-2">
                    <button onClick={() => approveIntent(intent.id)} className="flex-1 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => setRejectingId(intent.id)} className="flex-1 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-xl font-bold font-serif mb-4">All Intents</h3>
        {/* Intents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {existingIntents.map((intent) => (
            <div
              key={intent.id}
              className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all"
            >
              {editingIntent === intent.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Description</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Category</label>
                      <select
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Status</label>
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm"
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => saveEdit(intent.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                    >
                      <Check size={16} />
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full text-xs font-bold uppercase">
                        {intent.category || 'General'}
                      </span>
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] mt-2">{intent.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(intent)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                        title="Edit intent"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(intent.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete intent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2">
                    {intent.description || 'No description'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1 px-3 py-1 bg-[var(--color-bg-secondary)]/5 rounded-full text-xs">
                      <MapPin size={12} />
                      {intent.location || 'Remote'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      intent.status === 'looking' ? 'bg-green-500/20 text-green-500' :
                      intent.status === 'active' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {intent.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold">
                        {intent.created_by?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{intent.created_by?.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{intent.created_by?.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(intent.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>


        {existingIntents.length === 0 && (
          <div className="text-center py-12 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)]">
            <Briefcase size={48} className="mx-auto text-[var(--color-text-secondary)] mb-4" />
            <p className="text-[var(--color-text-secondary)]">No active intents found</p>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {rejectingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 max-w-md w-full mx-4 border border-[var(--color-border)]">
              <h3 className="text-lg font-bold text-red-500 mb-2">Reject Intent</h3>
              <p className="text-[var(--color-text-secondary)] mb-4 text-sm">
                Provide a reason for rejection. This will be visible to the user.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Type rejection reason here..."
                rows={4}
                className="w-full px-3 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm mb-6 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setRejectingId(null); setRejectReason(''); }}
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]/5 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={rejectIntent}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Confirm Delete</h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Are you sure you want to delete this intent? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]/5 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteIntent(deleteConfirm)}
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
