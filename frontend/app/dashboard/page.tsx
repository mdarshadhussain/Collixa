'use client'

import { Search, Plus, MapPin, Clock, Users, LogOut, Settings, LayoutDashboard, FileText, MessageSquare, ChevronDown, RefreshCw, ArrowUpRight, Sun, Moon } from 'lucide-react'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import { useRouter } from 'next/navigation'
import type { Intent } from '@/lib/supabase'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'

const CATEGORIES = ['All', 'Design', 'Development', 'Marketing', 'Data', 'Other']
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  
  const [intents, setIntents] = useState<Intent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch intents from API
  const fetchIntents = async () => {
    if (!loading) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/intents`)
      const data = await response.json()

      if (response.ok) {
        setIntents(data.data || [])
      } else {
        setError('Failed to load projects')
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
    fetchIntents()
  }, [])

  // Filter logic
  const filteredIntents = intents.filter((intent) => {
    const matchesSearch = intent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (intent.description && intent.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = filterCategory === 'All' || 
      (intent.category && intent.category.toLowerCase() === filterCategory.toLowerCase());
    
    return matchesSearch && matchesCategory
  })

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--color-accent)]"></div>
          <p className="text-[var(--color-accent)] mt-4 font-serif italic text-xl">Loading platform...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col font-sans transition-colors duration-700">
      
      <Header />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 gap-8">
        
        <Sidebar />

        {/* ─── MAIN PROJECTS AREA ─── */}
        <main className="flex-1 overflow-y-auto">
          <div className="space-y-10">
            
            {/* Search & Actions Mobile */}
            <div className="lg:hidden flex flex-col gap-4">
               <div className="relative">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                 <input
                   type="text"
                   placeholder="Search projects..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-xs font-medium focus:ring-1 focus:ring-[var(--color-accent)]"
                 />
               </div>
            </div>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-8">
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)]">Explore</span>
                <h2 className="text-4xl md:text-5xl font-serif font-black leading-tight text-[var(--color-text-primary)]">Find your next <br /><span className="italic font-light text-[var(--color-accent)]">collaboration.</span></h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative hidden lg:block mr-2">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-6 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-[var(--color-accent)] w-72 transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={fetchIntents}
                  className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent-soft)] transition-all text-[var(--color-accent)] shadow-sm"
                >
                  <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => router.push('/create')}
                  className="px-10 py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 transition-all hover:bg-[var(--color-text-primary)] shadow-xl shadow-[var(--color-accent)]/10 rounded-2xl"
                >
                   Post Project <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Filter Pill List */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                   onClick={() => setFilterCategory(cat)}
                  className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    filterCategory === cat 
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]' 
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] shadow-sm'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Content States */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[4/5] bg-[var(--color-bg-secondary)] rounded-[2.5rem] animate-pulse p-10 flex flex-col justify-end border border-[var(--color-border)]">
                    <div className="h-4 w-20 bg-[var(--color-border)] rounded mb-6" />
                    <div className="h-10 w-full bg-[var(--color-border)] rounded" />
                  </div>
                ))}
              </div>
            ) : filteredIntents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredIntents.map((intent) => (
                  <div
                    key={intent.id}
                    onClick={() => router.push(`/intent/${intent.id}`)}
                    className="group aspect-[4/5] bg-[var(--color-bg-secondary)] rounded-[2.5rem] p-10 flex flex-col border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] hover:shadow-2xl transition-all duration-700 cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-10 transform translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700">
                       <ArrowUpRight size={28} className="text-[var(--color-accent)]" />
                    </div>

                    <div className="mb-auto">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mb-6 block">{intent.category || 'General'}</span>
                       <h3 className="text-3xl font-serif font-black text-[var(--color-text-primary)] leading-[1.2] line-clamp-3 group-hover:text-[var(--color-accent)] transition-colors">
                         {intent.title}
                       </h3>
                    </div>

                    <div className="space-y-8">
                       <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
                          <div className="flex items-center gap-2">
                             <MapPin size={16} className="text-[var(--color-accent)]" />
                             <span className="text-[10px] uppercase font-bold tracking-widest">{('location' in intent && typeof intent.location === 'string') ? intent.location : 'Remote'}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                             <Clock size={16} />
                             <span className="text-[10px] items-center">{intent.created_at ? new Date(intent.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Now'}</span>
                          </div>
                       </div>
                       
                       <div className="pt-10 border-t border-[var(--color-border)] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-[var(--color-accent-soft)]/50 border border-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-serif font-bold text-sm">
                               {intent.created_by && typeof intent.created_by === 'object' ? ((intent.created_by as any).name?.[0] || 'C') : 'C'}
                             </div>
                             <div>
                                <p className="text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-secondary)] leading-none mb-1.5">Project Lead</p>
                                <p className="text-[10px] font-bold text-[var(--color-text-primary)] leading-none">{intent.created_by && typeof intent.created_by === 'object' ? ((intent.created_by as any).name || 'Member') : 'Member'}</p>
                             </div>
                          </div>
                          <Badge variant="green" className="text-[9px] uppercase font-bold tracking-widest bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-none px-4 py-1.5 rounded-full">
                            {intent.status === 'looking' ? 'Open' : 'Active'}
                          </Badge>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 bg-[var(--color-bg-secondary)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)]">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-10">No Projects Found</p>
                <h3 className="text-4xl font-serif font-light mb-10 italic text-[var(--color-text-primary)] line-separate">No projects matched <br />your search.</h3>
                <button 
                  onClick={() => router.push('/create')}
                  className="px-12 py-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--color-text-primary)] transition-all rounded-2xl"
                >
                  Create New Project
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
