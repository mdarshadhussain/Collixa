'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Users, Trash2, Ban, CheckCircle, Search, Loader2 } from 'lucide-react'
import { notify } from '@/lib/utils'

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
  const [isDeleting, setIsDeleting] = useState(false)

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
    setIsDeleting(true)
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
        notify.success('User deleted successfully')
      } else {
        const data = await response.json()
        notify.error(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      notify.error('Connectivity error. Failed to delete user.')
    } finally {
      setIsDeleting(false)
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
          <div className="overflow-hidden w-full">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">User</th>
                  <th className="hidden lg:table-cell px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Email</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] text-center">Credits</th>
                  <th className="hidden md:table-cell px-6 py-4 text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] text-center">Role</th>
                  <th className="px-4 sm:px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-bg-secondary)]/10 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[var(--color-text-primary)] text-sm">{user.name}</span>
                          <span className="lg:hidden text-[10px] text-[var(--color-text-secondary)] truncate max-w-[120px]">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 text-[var(--color-text-secondary)] text-sm">{user.email}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full text-[10px] font-black tracking-tight border border-[var(--color-accent)]/20">
                        {user.credits || 0}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                        user.role === 'VERIFIED_USER' ? 'bg-green-500/10 text-green-500' :
                        user.role === 'BANNED' ? 'bg-red-500/10 text-red-500' :
                        'bg-gray-500/10 text-gray-500'
                      } border border-current opacity-80`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]/5 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => deleteUser(deleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all min-w-[80px] flex items-center justify-center disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
