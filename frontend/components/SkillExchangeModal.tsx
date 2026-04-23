'use client'

import { useState } from 'react'
import { X, Send, Calendar, MessageSquare, Sparkles } from 'lucide-react'
import { skillService } from '@/lib/supabase'
import Avatar from './Avatar'
import AIMatchInsight from './AIMatchInsight'

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
  const [activeTab, setActiveTab] = useState<'propose' | 'insight'>('propose')

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
      
      <div className="relative w-full max-w-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        {/* Compact Header */}
        <div className="px-6 pt-6 pb-4 flex justify-between items-center border-b border-[var(--color-border)]/50">
          <div className="flex items-center gap-3">
             <Avatar name={skill.user.name} src={skill.user.avatar_url} size="xs" />
             <div>
                <h2 className="text-sm font-black tracking-tighter italic">Connect with {skill.user.name.split(' ')[0]}</h2>
                <p className="text-[9px] font-bold text-[var(--color-accent)] uppercase tracking-widest">{skill.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-primary)] rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Content Tabs */}
        <div className="flex border-b border-[var(--color-border)]/50 bg-[var(--color-bg-primary)]/50">
           <button 
             onClick={() => setActiveTab('propose')}
             className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'propose' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent opacity-50'}`}
           >
              Propose Session
           </button>
           <button 
             onClick={() => setActiveTab('insight')}
             className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === 'insight' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent opacity-50'}`}
           >
              <Sparkles size={10} /> AI Insight
           </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
          {activeTab === 'propose' ? (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-3">
                <div className="p-4 bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)]/50">
                  <p className="text-[10px] text-[var(--color-text-secondary)] italic leading-relaxed">
                    You're requesting to learn <span className="font-bold text-[var(--color-text-primary)]">"{skill.name}"</span> from {skill.user.name}. Propose a clear time or goal for your session.
                  </p>
                </div>
                
                <textarea
                  required
                  placeholder="Example: I'd love a 30m intro to your workflow next week. Are you free Tuesday?"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="editorial-textarea text-xs min-h-[140px]"
                />
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full py-4 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-[var(--color-accent)] hover:text-black transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-40"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-[var(--color-bg-primary)] border-t-transparent animate-spin rounded-full" />
                ) : (
                  <>
                    <Send size={16} />
                    Send Request
                  </>
                )}
              </button>
              
              {error && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-[9px] font-bold text-center">
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <AIMatchInsight 
                 type="skill" 
                 itemId={skill.id} 
                 itemTitle={skill.name} 
                 itemDescription={skill.user.name + " expertise"} 
               />
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-[var(--color-bg-primary)]/30 border-t border-[var(--color-border)]/50 text-center">
           <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40">Connecting for mutual growth</p>
        </div>
      </div>
    </div>
  )
}
