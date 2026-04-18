'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Check, X, ShieldAlert, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminApprovals() {
  const [pendingIntents, setPendingIntents] = useState<any[]>([])
  const [pendingTribes, setPendingTribes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      const [intentRes, tribeRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/intents`, { headers }),
        fetch(`${API_URL}/api/admin/tribes`, { headers })
      ])

      if (intentRes.ok) {
        const data = await intentRes.json()
        setPendingIntents(data.data.filter((i: any) => i.status === 'pending'))
      }
      
      if (tribeRes.ok) {
        const data = await tribeRes.json()
        setPendingTribes(data.data.filter((t: any) => t.status === 'pending'))
      }
    } catch (error) {
      console.error('Error fetching pending content:', error)
      alert('Failed to load pending content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleApprove = async (id: string, type: 'intents' | 'tribes') => {
    try {
      const token = localStorage.getItem('auth_token')
      const newStatus = type === 'intents' ? 'looking' : 'active'
      
      const res = await fetch(`${API_URL}/api/admin/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        alert(`Successfully approved ${type.slice(0, -1)}`)
        fetchPending()
      } else {
        alert(`Failed to approve ${type.slice(0, -1)}`)
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  const handleReject = async (id: string, type: 'intents' | 'tribes') => {
    if (!window.confirm('Are you sure you want to reject and delete this content?')) return

    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`${API_URL}/api/admin/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        alert(`Successfully rejected and deleted ${type.slice(0, -1)}`)
        fetchPending()
      } else {
        alert(`Failed to reject ${type.slice(0, -1)}`)
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-6xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-black text-[var(--color-text-primary)]">Pending Approvals</h2>
            <p className="text-[var(--color-text-secondary)] mt-1">Review new Intents and Tribes submitted by users.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* INTENTS */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] p-6 lg:p-8">
             <h3 className="text-xl font-bold font-serif mb-6 flex items-center justify-between">
                Pending Intents
                <span className="bg-amber-500/20 text-amber-500 text-xs px-3 py-1 rounded-full">{pendingIntents.length}</span>
             </h3>
             <div className="space-y-4">
                {pendingIntents.length === 0 ? (
                  <p className="text-sm opacity-50 italic">No intents pending approval.</p>
                ) : (
                  pendingIntents.map(intent => (
                    <div key={intent.id} className="p-4 border border-[var(--color-border)] rounded-2xl">
                       <h4 className="font-bold text-md">{intent.title}</h4>
                       <p className="text-xs opacity-60 mb-3 line-clamp-2">{intent.description}</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] mb-4">By: {intent.created_by?.name || 'Unknown'}</p>
                       
                       <div className="flex gap-2">
                         <button onClick={() => handleApprove(intent.id, 'intents')} className="flex-1 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                            <Check size={14} /> Approve
                         </button>
                         <button onClick={() => handleReject(intent.id, 'intents')} className="py-2 px-4 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all flex items-center justify-center">
                            <X size={14} />
                         </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* TRIBES */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] p-6 lg:p-8">
             <h3 className="text-xl font-bold font-serif mb-6 flex items-center justify-between">
                Pending Tribes
                <span className="bg-amber-500/20 text-amber-500 text-xs px-3 py-1 rounded-full">{pendingTribes.length}</span>
             </h3>
             <div className="space-y-4">
                {pendingTribes.length === 0 ? (
                  <p className="text-sm opacity-50 italic">No tribes pending approval.</p>
                ) : (
                  pendingTribes.map(tribe => (
                    <div key={tribe.id} className="p-4 border border-[var(--color-border)] rounded-2xl">
                       <h4 className="font-bold text-md">{tribe.name}</h4>
                       <p className="text-xs opacity-60 mb-3 line-clamp-2">{tribe.description}</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] mb-4">By: {tribe.user?.name || 'Unknown'}</p>
                       
                       <div className="flex gap-2">
                         <button onClick={() => handleApprove(tribe.id, 'tribes')} className="flex-1 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2">
                            <Check size={14} /> Approve
                         </button>
                         <button onClick={() => handleReject(tribe.id, 'tribes')} className="py-2 px-4 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all flex items-center justify-center">
                            <X size={14} />
                         </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
