'use client'

import { Search, Plus, MapPin, Clock, Users, LogOut, Settings, LayoutDashboard, FileText, MessageSquare, ChevronDown, RefreshCw, ArrowUpRight, Sun, Moon } from 'lucide-react'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import { useRouter } from 'next/navigation'
import { Intent, intentService, storageService } from '@/lib/supabase'
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

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-3 sm:px-4 md:px-8 py-5 md:py-8 gap-4 md:gap-8">
        
        <Sidebar />

        {/* ─── MAIN PROJECTS AREA ─── */}
        <main className="flex-1 overflow-y-auto">
          <div className="space-y-6 md:space-y-10">
            
            {/* Search & Actions Mobile */}
            <div className="lg:hidden flex flex-col gap-3">
               <div className="relative">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                 <input
                   type="text"
                   placeholder="Search projects..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-11 pr-4 py-3.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-xs font-medium focus:ring-1 focus:ring-[var(--color-accent)]"
                 />
               </div>
            </div>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 md:gap-10 bg-[var(--color-bg-secondary)]/70 border border-[var(--color-border)] rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-8">
              <div className="space-y-6 w-full md:w-auto">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.35em] sm:tracking-[0.5em] text-[var(--color-accent)] block mb-2">Explore Feed</span>
                <h2 className="text-h2 !leading-[1]">Find your next <br /><span className="italic font-light text-[var(--color-accent)]">collaboration.</span></h2>
              </div>
              
              <div className="flex w-full md:w-auto items-center gap-2 sm:gap-3 flex-wrap md:flex-nowrap">
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
                  className="p-3 sm:p-4 md:p-5 rounded-xl md:rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-accent-soft)] transition-all text-[var(--color-accent)] shadow-sm"
                >
                  <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => router.push('/create')}
                  className="flex-1 md:flex-none px-4 sm:px-6 md:px-10 py-3.5 md:py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.22em] md:tracking-[0.3em] flex items-center justify-center gap-2 sm:gap-3 md:gap-4 transition-all hover:bg-[var(--color-text-primary)] shadow-xl shadow-[var(--color-accent)]/20 rounded-xl md:rounded-2xl"
                >
                   Post Project <ArrowUpRight size={16} />
                </button>
              </div>
            </div>

            {/* Filter Pill List */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-3 md:pb-4 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                   onClick={() => setFilterCategory(cat)}
                  className={`px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full text-[9px] font-black uppercase tracking-[0.14em] sm:tracking-widest transition-all whitespace-nowrap ${
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6 lg:gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[3/4] md:aspect-[4/5] bg-[var(--color-bg-secondary)] rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] animate-pulse p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-end border border-[var(--color-border)]">
                    <div className="h-4 w-20 bg-[var(--color-border)] rounded mb-6" />
                    <div className="h-10 w-full bg-[var(--color-border)] rounded" />
                  </div>
                ))}
              </div>
            ) : filteredIntents.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6 lg:gap-8">
                {filteredIntents.map((intent) => (
                  <div
                    key={intent.id}
                    onClick={() => router.push(`/intent/${intent.id}`)}
                    className="group min-h-[300px] sm:min-h-[360px] md:min-h-[420px] lg:min-h-[460px] bg-[var(--color-bg-secondary)] rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] p-3 sm:p-5 md:p-7 lg:p-10 flex flex-col border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] hover:shadow-2xl transition-all duration-700 cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 sm:p-5 md:p-8 lg:p-10 transform translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700 z-10">
                       <ArrowUpRight size={16} className="text-[var(--color-accent)] sm:w-[18px] sm:h-[18px] md:w-[22px] md:h-[22px]" />
                    </div>

                    {/* Image Header if exists */}
                    {intent.attachment_name && (
                      <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden rounded-t-[1.5rem] md:rounded-t-[2.5rem] opacity-40 group-hover:opacity-60 transition-opacity">
                        <img 
                          src={storageService.getPublicUrl(intent.attachment_name)} 
                          alt={intent.title} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-bg-secondary)]"></div>
                      </div>
                    )}

                    <div className={`mb-auto relative z-10 ${intent.attachment_name ? 'pt-14 sm:pt-18 md:pt-24' : ''}`}>
                       <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.14em] sm:tracking-[0.2em] md:tracking-[0.3em] text-[var(--color-accent)] mb-3 sm:mb-4 md:mb-6 block">{intent.category || 'General'}</span>
                       <h3 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-serif font-black text-[var(--color-text-primary)] leading-[1.15] line-clamp-3 group-hover:text-[var(--color-accent)] transition-colors">
                         {intent.title}
                       </h3>
                    </div>

                    <div className="space-y-3 sm:space-y-5 md:space-y-8 relative z-10">
                       <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 text-[var(--color-text-secondary)]">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                             <MapPin size={12} className="text-[var(--color-accent)] sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                             <span className="text-[8px] sm:text-[9px] md:text-[10px] uppercase font-bold tracking-[0.08em] sm:tracking-[0.12em] md:tracking-widest truncate">{('location' in intent && typeof intent.location === 'string') ? intent.location : 'Remote'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 md:ml-auto">
                             <Clock size={12} className="sm:w-[14px] sm:h-[14px] md:w-4 md:h-4" />
                             <span className="text-[8px] sm:text-[9px] md:text-[10px] items-center">{intent.created_at ? new Date(intent.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Now'}</span>
                          </div>
                       </div>
                       
                       <div className="pt-3 sm:pt-5 md:pt-8 lg:pt-10 border-t border-[var(--color-border)] flex items-center justify-between gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                             <Avatar 
                               name={intent.created_by && typeof intent.created_by === 'object' ? (intent.created_by as any).name : 'Member'}
                               src={intent.created_by && typeof intent.created_by === 'object' && (intent.created_by as any).avatar_url ? storageService.getPublicUrl((intent.created_by as any).avatar_url) : undefined}
                               size="sm"
                               className="border border-[var(--color-accent-soft)]"
                             />
                             <div className="min-w-0">
                                <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-secondary)] leading-none mb-1">Project Lead</p>
                                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[var(--color-text-primary)] leading-none truncate">{intent.created_by && typeof intent.created_by === 'object' ? ((intent.created_by as any).name || 'Member') : 'Member'}</p>
                             </div>
                          </div>
                          <Badge variant="green" className="text-[7px] sm:text-[8px] md:text-[9px] uppercase font-bold tracking-[0.06em] sm:tracking-[0.08em] md:tracking-widest bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-none px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full shrink-0">
                            {intent.status === 'looking' ? 'Open' : 'Active'}
                          </Badge>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-28 md:py-40 px-4 bg-[var(--color-bg-secondary)] rounded-[1.5rem] md:rounded-[3rem] border-2 border-dashed border-[var(--color-border)]">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[var(--color-text-secondary)] mb-6 md:mb-10">No Projects Found</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-light mb-6 md:mb-10 italic text-[var(--color-text-primary)] line-separate">No projects matched <br />your search.</h3>
                <button 
                  onClick={() => router.push('/create')}
                  className="px-6 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.3em] hover:bg-[var(--color-text-primary)] transition-all rounded-xl md:rounded-2xl"
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
