'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Users, Trash2, Ban, CheckCircle, Search } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
  id: string
  name: string
  email: string
  credits: number
  role: string
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="text-2xl font-serif font-black text-[var(--color-text-primary)]">User Management</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Manage platform users</p>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">User</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Email</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Credits</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Role</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[var(--color-text-primary)]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-secondary)] text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full text-xs font-bold">
                      {user.credits || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-500' :
                      user.role === 'VERIFIED_USER' ? 'bg-green-500/20 text-green-500' :
                      user.role === 'BANNED' ? 'bg-red-500/20 text-red-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {user.role !== 'ADMIN' && (
                        <>
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--color-text-secondary)]">No users found</p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Confirm Delete</h3>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-white/5 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser(deleteConfirm)}
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
