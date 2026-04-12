'use client'

import { MapPin, Clock, LogOut, Settings, LayoutDashboard, FileText, MessageSquare, ChevronDown, RefreshCw, Edit, Trash2, ArrowUpRight, Users, Plus, BrainCircuit } from 'lucide-react'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import type { Intent } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function MyIntentsPage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, loading: authLoading, token } = useAuth()
  const { theme } = useTheme()
  
  const [intents, setIntents] = useState<Intent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <div className="inline-block h-24 w-24 animate-spin rounded-full border-b-4 border-[var(--color-accent)]"></div>
          <p className="text-[var(--color-accent)] mt-8 font-serif italic text-2xl animate-pulse">Loading items...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col font-sans transition-colors duration-700">
      
      <Header />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 gap-8">
        
        <Sidebar />

        {/* ─── MAIN CONTENT ─── */}
        <main className="flex-1 space-y-12">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-8 border-b border-[var(--color-border)] pb-8">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)]">Personal</span>
              <h2 className="text-5xl md:text-6xl font-serif font-black leading-tight text-[var(--color-text-primary)] italic tracking-tighter">My Projects.</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">Manage your active collaborations</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={fetchMyIntents}
                className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent-soft)] transition-all text-[var(--color-accent)] shadow-sm"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button 
                onClick={() => router.push('/create')}
                className="px-10 py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 transition-all hover:bg-[var(--color-text-primary)] shadow-xl shadow-[var(--color-accent)]/20 rounded-2xl"
              >
                Post Project <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && !loading && (
            <div className="p-16 bg-red-500/5 rounded-[3rem] border border-red-500/10 text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                 <RefreshCw size={24} />
              </div>
              <h3 className="text-2xl font-serif italic text-red-500">{error}</h3>
              <button onClick={fetchMyIntents} className="px-8 py-3 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl">Retry</button>
            </div>
          )}

          {/* Content States */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[4/3] bg-[var(--color-bg-secondary)] rounded-[2.5rem] animate-pulse border border-[var(--color-border)]" />
              ))}
            </div>
          ) : intents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {intents.map((intent) => (
                <div
                  key={intent.id}
                  onClick={() => router.push(`/intent/${intent.id}`)}
                  className="group relative bg-[var(--color-bg-secondary)] rounded-[2.5rem] p-10 flex flex-col border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-10 translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
                     <ArrowUpRight size={28} className="text-[var(--color-accent)]" />
                  </div>

                  <div className="mb-10">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-4 block opacity-60 group-hover:opacity-100 transition-opacity">{intent.category || 'General Project'}</span>
                     <h3 className="text-3xl font-serif font-black text-[var(--color-text-primary)] leading-tight line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors">
                       {intent.title}
                     </h3>
                  </div>

                  <div className="mt-auto space-y-8">
                     <div className="flex items-center gap-6">
                       <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                         intent.status === 'looking' 
                         ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/10' 
                         : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
                       }`}>
                          {intent.status === 'looking' ? 'Open' : 'Active'}
                       </span>
                       <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-[9px] font-black uppercase tracking-[0.3em] ml-auto opacity-50">
                          <Clock size={16} />
                          {intent.created_at ? new Date(intent.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent'}
                       </div>
                     </div>
                     
                     <div className="pt-8 border-t border-[var(--color-border)] grid grid-cols-2 gap-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/create?id=${intent.id}`)
                          }}
                          className="flex items-center justify-center gap-3 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] hover:border-[var(--color-accent)] rounded-xl transition-all shadow-sm"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, intent.id)}
                          disabled={deletingId === intent.id}
                          className="flex items-center justify-center gap-3 py-4 bg-red-500/5 text-red-500 border border-red-500/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50 shadow-sm"
                        >
                          {deletingId === intent.id ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />} 
                          Delete
                        </button>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-40 bg-[var(--color-bg-secondary)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center group">
              <div className="w-20 h-20 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                 <Plus size={32} />
              </div>
              <h3 className="text-4xl font-serif font-light mb-10 italic text-[var(--color-text-primary)]">Your project list <br />is currently empty.</h3>
              <button 
                onClick={() => router.push('/create')}
                className="px-12 py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.5em] transition-all hover:bg-[var(--color-text-primary)] rounded-full shadow-2xl shadow-[var(--color-accent)]/10"
              >
                Create Your First Project
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

