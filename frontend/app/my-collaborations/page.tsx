'use client'

import { MapPin, Clock, Edit, Trash2, ArrowUpRight, Plus, RefreshCw } from 'lucide-react'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import Typewriter from '@/components/Typewriter'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { storageService } from '@/lib/supabase'
import type { Intent } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function MyCollaborationsPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, token } = useAuth()
  
  const [intents, setIntents] = useState<Intent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  const fetchMyIntents = async () => {
    if (!loading) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/intents/user/my-intents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (response.ok) {
        setIntents(data.data || [])
      } else {
        setError(data.error || 'Failed to load your projects')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchMyIntents()
    }
  }, [token])

  const handleDelete = async (e: React.MouseEvent, intentId: number | string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return

    setDeletingId(intentId)
    try {
      const response = await fetch(`${API_URL}/api/intents/${intentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setIntents((prev) => prev.filter((i) => i.id !== intentId))
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete project')
      }
    } catch (err) {
      alert('Connection error. Please try again.')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6 md:space-y-12">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-5 md:gap-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[3rem] p-6 sm:p-8 md:p-12 shadow-xl shadow-[var(--color-accent)]/5">
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] opacity-60">Personal Platform</span>
            <h2 className="text-4xl md:text-6xl font-serif font-black leading-tight text-[var(--color-text-primary)] tracking-tighter">
              <Typewriter text="My Collaborations." speed={0.05} delay={0.2} />
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-primary)] opacity-40">Manage your active projects and requests</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
            <button
              onClick={fetchMyIntents}
              className="p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent-soft)] transition-all text-[var(--color-accent)] shadow-sm"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/create"
              className="flex-1 md:flex-none px-4 sm:px-6 md:px-10 py-3.5 md:py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3 transition-all hover:bg-[var(--color-text-primary)] shadow-xl shadow-[var(--color-accent)]/20 rounded-xl md:rounded-2xl"
            >
              Post New <Plus size={18} />
            </Link>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="p-12 bg-red-500/5 rounded-[2rem] border border-red-500/10 text-center space-y-6">
            <h3 className="text-2xl font-serif italic text-red-500">{error}</h3>
            <button onClick={fetchMyIntents} className="px-8 py-3 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl">Retry</button>
          </div>
        )}

        {/* Content States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] bg-[var(--color-bg-secondary)] rounded-[2.5rem] animate-pulse border border-[var(--color-border)]" />
            ))}
          </div>
        ) : intents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {intents.map((intent) => (
              <div
                key={intent.id}
                onClick={() => router.push(`/intent/${intent.id}`)}
                className="group relative bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
                   <ArrowUpRight size={20} className="text-[var(--color-accent)]" />
                </div>

                <div className="mb-10">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-4 block">{intent.category || 'General'}</span>
                   <h3 className="text-xl md:text-2xl font-serif font-black text-[var(--color-text-primary)] leading-tight line-clamp-3 group-hover:text-[var(--color-accent)] transition-colors">
                     {intent.title}
                   </h3>
                </div>

                <div className="mt-auto space-y-8">
                   <div className="flex items-center justify-between">
                     <Badge variant="sage" className="text-[9px] font-black bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] uppercase tracking-widest border-none px-4 py-1.5 ring-1 ring-[var(--color-accent)]/10">
                        {intent.status === 'looking' ? 'Recruiting' : 'In Progress'}
                     </Badge>
                     <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                        <Clock size={14} />
                        <span className="text-[10px] font-bold">{new Date(intent.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                     </div>
                   </div>
                   
                   <div className="pt-8 border-t border-[var(--color-border)] grid grid-cols-2 gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/create?id=${intent.id}`)
                        }}
                        className="flex items-center justify-center gap-2 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] rounded-xl lg:rounded-2xl transition-all"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, intent.id)}
                        disabled={deletingId === intent.id}
                        className="flex items-center justify-center gap-2 py-4 bg-red-500/5 text-red-500 border border-red-500/10 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white rounded-xl lg:rounded-2xl transition-all disabled:opacity-50"
                      >
                        {deletingId === intent.id ? <RefreshCw className="animate-spin" size={14} /> : <Trash2 size={14} />} 
                        Delete
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-[var(--color-bg-secondary)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center group">
            <h3 className="text-3xl font-serif font-light mb-10 italic text-[var(--color-text-primary)] opacity-40">Your project list <br />is currently empty.</h3>
            <button 
              onClick={() => router.push('/create')}
              className="px-12 py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-[var(--color-text-primary)] rounded-full shadow-2xl"
            >
              Start New Collaboration
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
