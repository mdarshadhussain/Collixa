'use client'

import { useState } from 'react'
import { X, Send, Calendar, MessageSquare } from 'lucide-react'
import { skillService } from '@/lib/supabase'
import Avatar from './Avatar'

interface SkillExchangeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
  skill: {
    id: string
    name: string
    user: {
      name: string
      avatar_url?: string
    }
  } | null
}

export default function SkillExchangeModal({ isOpen, onClose, onSuccess, skill }: SkillExchangeModalProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !skill) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await skillService.requestExchange({
        skillId: skill.id,
        message
      })
      if (res.success) {
        onSuccess('Request sent. You will be notified once provider accepts or rejects.')
        onClose()
      } else {
        setError(res.error || 'Failed to request exchange')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred while sending request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-10">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] italic">Exchange Request</span>
              <h2 className="text-4xl font-serif font-black tracking-tighter italic">Connect.</h2>
              <div className="flex items-center gap-4 py-4 px-6 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl">
                 <Avatar name={skill.user.name} src={skill.user.avatar_url} size="sm" />
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-50">Skill Provider</p>
                    <p className="text-sm font-bold">{skill.user.name}</p>
                 </div>
              </div>
            </div>
            <button onClick={onClose} className="p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-accent-soft)] transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="mb-8 p-6 bg-[var(--color-accent-soft)]/20 border border-[var(--color-accent)]/10 rounded-2xl">
             <div className="flex items-center gap-3 text-[var(--color-accent)] mb-2">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Requested Expertise</span>
             </div>
             <p className="text-xl font-serif italic text-[var(--color-text-primary)]">{skill.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-3 ml-1">
                <MessageSquare size={12} className="text-[var(--color-accent)]" />
                Propose a session
              </label>
              <textarea
                required
                placeholder="Hi! I'd love to learn about this. Are you available for a 30m call next Tuesday?"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-6 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm font-medium focus:border-[var(--color-accent)] outline-none transition-all resize-none"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-6 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-[var(--color-accent)] transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-40"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-[var(--color-bg-primary)] border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Send size={18} />
                  Send Request
                </>
              )}
            </button>
            {error && (
              <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-semibold">
                {error}
              </div>
            )}
            <p className="text-[9px] text-center font-bold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40">Connecting you for mutual growth</p>
          </form>
        </div>
      </div>
    </div>
  )
}
