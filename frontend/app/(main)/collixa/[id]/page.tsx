'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { 
  DollarSign, ChevronLeft, Calendar, MapPin, Globe, 
  ArrowUpRight, Zap, MessageCircle, Heart, Share2 
} from 'lucide-react'
import type { Intent } from '@/lib/supabase'
import { storageService } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function IntentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [intent, setIntent] = useState<Intent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchIntent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/intents/${params.id}`)
        const data = await response.json()
        if (response.ok) {
          setIntent(data.data)
        } else {
          setError(data.error || 'Intent not found')
        }
      } catch (err) {
        setError('Failed to load intent details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchIntent()
  }, [params.id])

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="animate-pulse space-y-10">
          <div className="h-4 w-32 bg-[var(--color-border)] rounded-full" />
          <div className="h-64 bg-[var(--color-bg-secondary)] rounded-[3rem] border border-[var(--color-border)]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             <div className="lg:col-span-2 h-96 bg-[var(--color-bg-secondary)] rounded-[3rem] border border-[var(--color-border)]" />
             <div className="h-96 bg-[var(--color-bg-secondary)] rounded-[3rem] border border-[var(--color-border)]" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !intent) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-5xl font-serif font-black text-[var(--color-text-primary)] mb-6 italic">Fragmented Vision.</h2>
          <p className="text-[var(--color-text-secondary)] text-lg mb-12 uppercase tracking-[0.2em] font-bold">{error || 'This intent has dissolved into the binary.'}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-12 py-6 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--color-inverse-bg)] transition-all"
          >
            Back to Marketplace
          </button>
      </main>
    )
  }

  const creatorName = typeof intent.created_by === 'object' ? (intent.created_by as any)?.name || 'Anonymous' : 'Anonymous'

  return (
    <div className="space-y-12">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all mb-12"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Retrace Steps
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Header Card */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-[var(--color-accent)]/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-100 transition-opacity duration-1000">
                 <ArrowUpRight size={48} className="text-[var(--color-accent)]" />
              </div>

              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] block">{intent.category || 'General Collaboration'}</span>
                    <h1 className="text-4xl md:text-6xl font-serif font-black text-[var(--color-text-primary)] leading-[1.1]">{intent.title}</h1>
                  </div>
                  <Badge variant="green" className="py-2.5 px-6 rounded-full text-[9px] font-black tracking-[0.2em] uppercase bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-none self-start">
                    {intent.status === 'looking' ? 'Open Intent' : intent.status === 'completed' ? 'Fulfilled' : 'Active'}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-10 pt-12 border-t border-[var(--color-border)]">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-serif text-lg font-black border border-[var(--color-accent)]/20 shadow-inner">
                       {creatorName[0]}
                     </div>
                     <div>
                       <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-1">Initiator</p>
                       <p className="text-sm font-black text-[var(--color-text-primary)]">{creatorName}</p>
                     </div>
                   </div>
                   <div className="h-10 w-px bg-[var(--color-border)] hidden sm:block" />
                   <div>
                     <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-1">Deployed</p>
                     <p className="text-sm font-black text-[var(--color-text-primary)]">{intent.created_at ? new Date(intent.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-10 md:p-16 rounded-[3rem]">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-10">Executive Summary</h2>
              <div className="prose prose-lg max-w-none text-[var(--color-text-primary)] leading-[1.8] font-sans">
                <div className="whitespace-pre-wrap text-lg opacity-90">{intent.description}</div>
              </div>
            </div>

            {/* Goal Section */}
            {intent.goal && (
              <div className="bg-[var(--color-accent-soft)]/10 border border-[var(--color-accent-soft)] p-10 md:p-12 rounded-[2.5rem]">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-6">The Ultimate Goal</h2>
                <p className="text-2xl md:text-3xl font-serif italic leading-relaxed text-[var(--color-text-primary)]">"{intent.goal}"</p>
              </div>
            )}

            {/* Attachments Section */}
            {intent.attachment_name && (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-10 rounded-[3rem] overflow-hidden">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-8">Visual Context & Assets</h2>
                <div className="rounded-[2rem] overflow-hidden shadow-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                  {intent.attachment_name.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                    <img 
                      src={storageService.getPublicUrl(intent.attachment_name)} 
                      alt="Intent Visualization" 
                      className="w-full h-auto max-h-[800px] object-contain"
                    />
                  ) : (
                    <div className="p-20 flex flex-col items-center justify-center gap-8">
                      <div className="w-24 h-24 bg-[var(--color-accent-soft)] rounded-[2rem] flex items-center justify-center text-[var(--color-accent)] shadow-xl border border-[var(--color-accent)]/10">
                        <Zap size={40} />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-xs uppercase tracking-[0.3em] text-[var(--color-text-primary)] mb-2">Encrypted Document Packet</p>
                        <p className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">{intent.attachment_name}</p>
                      </div>
                      <a 
                        href={storageService.getPublicUrl(intent.attachment_name)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-10 py-5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[var(--color-inverse-bg)] transition-all shadow-xl shadow-[var(--color-accent)]/20"
                      >
                        Access Archive
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-10">
            {/* Meta Info Card */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-10 rounded-[3rem] sticky top-32">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-10">Technical Specifications</h3>
              
              <div className="space-y-10">
                {intent.budget && (
                  <div className="group">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-3 group-hover:text-[var(--color-accent)] transition-colors">Economic Scope</p>
                    <p className="text-xl font-serif font-black text-[var(--color-text-primary)] flex items-center gap-3">
                      <span className="p-2 bg-[var(--color-accent-soft)] rounded-lg text-[var(--color-accent)]"><DollarSign size={20} /></span>
                      {intent.budget}
                    </p>
                  </div>
                )}

                {intent.timeline && (
                  <div className="group">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-3 group-hover:text-[var(--color-accent)] transition-colors">Timeline Anchor</p>
                    <p className="text-xl font-serif font-black text-[var(--color-text-primary)] flex items-center gap-3">
                      <span className="p-2 bg-[var(--color-accent-soft)] rounded-lg text-[var(--color-accent)]"><Calendar size={20} /></span>
                      {intent.timeline}
                    </p>
                  </div>
                )}

                <div className="group">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-3 group-hover:text-[var(--color-accent)] transition-colors">Geographic Root</p>
                  <p className="text-xl font-serif font-black text-[var(--color-text-primary)] flex items-center gap-3">
                    <span className="p-2 bg-[var(--color-accent-soft)] rounded-lg text-[var(--color-accent)]"><MapPin size={20} /></span>
                    {typeof intent.location === 'string' ? intent.location : 'Atmospheric (Remote)'}
                  </p>
                </div>
              </div>

              {/* Sidebar Actions */}
              <div className="mt-16 space-y-4">
                <button className="w-full py-6 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--color-inverse-bg)] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-[var(--color-accent)]/10">
                  Join Collective <Zap size={14} />
                </button>
                <button className="w-full py-6 border border-[var(--color-border)] text-[var(--color-text-primary)] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--color-accent-soft)] transition-all flex items-center justify-center gap-3">
                  Initiate Dialogue <MessageCircle size={14} />
                </button>
              </div>

              {/* Utility Actions */}
              <div className="flex gap-4 mt-8">
                <button className="flex-1 py-4 border border-[var(--color-border)] rounded-2xl flex items-center justify-center text-[var(--color-text-secondary)] hover:text-red-500 hover:border-red-500/20 transition-all">
                  <Heart size={20} />
                </button>
                <button className="flex-1 py-4 border border-[var(--color-border)] rounded-2xl flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-soft)] transition-all">
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

