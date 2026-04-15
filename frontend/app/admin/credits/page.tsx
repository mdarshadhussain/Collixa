'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Coins, Plus, Minus, Search, ArrowRight } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  type: string
  description: string
  created_at: string
  user: {
    name: string
    email: string
  }
}

export default function AdminCredits() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [creditAmount, setCreditAmount] = useState(10)
  const [creditReason, setCreditReason] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchData = async () => {
    try {
      const [transactionsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/credits`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        }),
        fetch(`${API_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
      ])

      if (transactionsRes.ok) {
        const transData = await transactionsRes.json()
        setTransactions(transData.data)
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addCredits = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/admin/credits/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          amount: creditAmount,
          reason: creditReason
        })
      })

      if (response.ok) {
        setShowAddModal(false)
        setSelectedUser('')
        setCreditAmount(10)
        setCreditReason('')
        fetchData()
      }
    } catch (error) {
      console.error('Error adding credits:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTransactions = transactions.filter(t =>
    t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.type?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="text-2xl font-serif font-black text-[var(--color-text-primary)]">Credit Management</h2>
            <p className="text-[var(--color-text-secondary)] text-sm">Manage user credits and view transactions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-accent)]/80 transition-all"
          >
            <Plus size={16} />
            Add Credits
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] text-sm">Total Transactions</p>
            <p className="text-3xl font-black text-[var(--color-text-primary)]">{transactions.length}</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] text-sm">Credits Added (Admin)</p>
            <p className="text-3xl font-black text-green-500">
              +{transactions.filter(t => t.type === 'ADMIN_ADD').reduce((sum, t) => sum + t.amount, 0)}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] text-sm">Credits Deducted (Admin)</p>
            <p className="text-3xl font-black text-red-500">
              {transactions.filter(t => t.type === 'ADMIN_DEDUCT').reduce((sum, t) => sum + t.amount, 0)}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          <table className="w-full">
            <thead className="border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">User</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Type</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Description</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredTransactions.slice(0, 50).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold">
                        {transaction.user?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{transaction.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{transaction.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      transaction.type === 'ADMIN_ADD' ? 'bg-green-500/20 text-green-500' :
                      transaction.type === 'ADMIN_DEDUCT' ? 'bg-red-500/20 text-red-500' :
                      transaction.type === 'PURCHASE' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-gray-500/20 text-gray-500'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                    {new Date(transaction.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <Coins size={48} className="mx-auto text-[var(--color-text-secondary)] mb-4" />
              <p className="text-[var(--color-text-secondary)]">No transactions found</p>
            </div>
          )}
        </div>

        {/* Add Credits Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Add Credits</h3>
              <form onSubmit={addCredits} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Select User</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  >
                    <option value="">Select a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.credits || 0} credits
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Amount</label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(parseInt(e.target.value))}
                    min="1"
                    className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Reason</label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="e.g., Bonus, Refund, etc."
                    className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-white/5 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/80 transition-all"
                  >
                    Add Credits
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
