'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, MessageSquare, ChevronRight, Inbox } from 'lucide-react'
import { skillService, User, storageService } from '@/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'

interface ExchangeRequest {
  id: string
  requester_id: string
  provider_id: string
  skill_id: string
  message: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SCHEDULED'
  created_at: string
  requester?: User
  skill?: any
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function RequestManager() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ExchangeRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    if (!user) return
    try {
      // We need a way to get incoming requests. 
      // For now, let's assume getExchanges returns both incoming and outgoing
      // Or we can add a specific incoming endpoint.
      // Let's use the generic search/get and filter by provider_id = current user
      const response = await fetch(`${API_URL}/api/skills/exchanges`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      const res = await response.json()
      if (res.success) {
        // Filter for incoming pending requests
        setRequests(res.data.filter((r: any) => r.provider_id === user.id && r.status === 'PENDING'))
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [user])

  const handleAction = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await fetch(`${API_URL}/api/skills/exchanges/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ status })
      })
      const res = await response.json()
      if (res.success) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
      }
    } catch (err) {
      console.error('Action failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-3xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] border-dashed">
        <div className="w-12 h-12 bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20">
          <Inbox size={24} />
        </div>
        <p className="text-sm font-serif italic text-[var(--color-text-secondary)]">No incoming requests.</p>
        <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-2">When experts reach out, they'll appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div 
          key={req.id} 
          className="group p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] hover:border-[var(--color-accent)] transition-all shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar 
                name={req.requester?.name || 'User'} 
                src={req.requester?.avatar_url ? (req.requester.avatar_url.startsWith('http') ? req.requester.avatar_url : storageService.getPublicUrl(req.requester.avatar_url)) : undefined} 
                size="md" 
              />
              <div>
                <h4 className="text-sm font-black tracking-tight">{req.requester?.name}</h4>
                <p className="text-[10px] text-[var(--color-text-secondary)] font-medium">wants to learn <span className="text-[var(--color-accent)] font-bold">{req.skill?.name || 'your skill'}</span></p>
              </div>
            </div>

            <div className="flex-1 md:px-8">
              <div className="p-4 bg-[var(--color-bg-primary)]/50 rounded-2xl border border-[var(--color-border)]">
                <div className="flex items-start gap-3">
                  <MessageSquare size={14} className="text-[var(--color-accent)] mt-0.5 opacity-50" />
                  <p className="text-[11px] leading-relaxed italic opacity-80">"{req.message || 'No message provided.'}"</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction(req.id, 'ACCEPTED')}
                className="flex-1 md:flex-none px-6 py-3 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[var(--color-text-primary)] transition-all shadow-lg shadow-[var(--color-accent)]/10 flex items-center justify-center gap-2"
              >
                <Check size={14} /> Accept
              </button>
              <button
                onClick={() => handleAction(req.id, 'REJECTED')}
                className="p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
