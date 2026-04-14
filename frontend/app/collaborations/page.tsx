'use client'

import { Search, Plus, RefreshCw, ArrowUpRight, MapPin, Clock } from 'lucide-react'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Intent, intentService, storageService } from '@/lib/supabase'
import Typewriter from '@/components/Typewriter'
import Layout from '@/components/Layout'

const CATEGORIES = ['All', 'Design', 'Development', 'Marketing', 'Data', 'Other']
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function CollaborationsPage() {
  const router = useRouter()
  
  const [intents, setIntents] = useState<Intent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

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

  return (
    <Layout>
      <div className="space-y-6 md:space-y-10">
        
        {/* Search & Actions Mobile */}
        <div className="lg:hidden flex flex-col gap-3">
           <div className="relative">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
             <input
               type="text"
               placeholder="Search collaborations..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-3.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-xs font-medium focus:ring-1 focus:ring-[var(--color-accent)]"
             />
           </div>
        </div>

        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 md:gap-10 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[3rem] p-6 sm:p-8 md:p-12 shadow-xl shadow-[var(--color-accent)]/5 group">
          <div className="space-y-6 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] block mb-2 opacity-60">Collaboration Portal</span>
            <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter leading-[1.1] text-[var(--color-text-primary)]">
              <Typewriter text="Join the best" speed={0.05} delay={0.1} /> <br />
              <span className="italic font-light text-[var(--color-accent)]">
                <Typewriter text="minds together." speed={0.05} delay={0.8} />
              </span>
            </h2>
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
            <div className="flex flex-1 md:flex-none gap-2">
              <button 
                onClick={() => router.push('/my-collaborations')}
                className="flex-1 md:flex-none px-4 sm:px-6 py-3.5 md:py-5 border border-[var(--color-accent)] text-[var(--color-accent)] text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-lg shadow-[var(--color-accent)]/10"
              >
                My Projects
              </button>
              <button 
                onClick={() => router.push('/create')}
                className="flex-1 md:flex-none px-4 sm:px-6 md:px-10 py-3.5 md:py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-[var(--color-text-primary)] shadow-xl shadow-[var(--color-accent)]/20 rounded-xl md:rounded-2xl"
              >
                Post Project <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pill List */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
               onClick={() => setFilterCategory(cat)}
              className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
                filterCategory === cat 
                ? 'bg-[var(--color-text-primary)] text-white border-[var(--color-text-primary)] shadow-lg shadow-[var(--color-text-primary)]/10' 
                : 'bg-white text-[var(--color-text-primary)] opacity-60 border-[var(--color-border)] hover:opacity-100 hover:border-[var(--color-accent-soft)]'
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
              <div key={i} className="aspect-[4/5] bg-[var(--color-bg-secondary)] rounded-[2rem] animate-pulse border border-[var(--color-border)]" />
            ))}
          </div>
        ) : filteredIntents.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6 lg:gap-8">
            {filteredIntents.map((intent) => (
              <div
                key={intent.id}
                onClick={() => router.push(`/intent/${intent.id}`)}
                className="group h-full bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:shadow-2xl transition-all duration-700 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 md:p-10 translate-x-4 -translate-y-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-700 z-10">
                   <ArrowUpRight size={24} className="text-[var(--color-accent)]" />
                </div>

                <div className="mb-auto relative z-10">
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mb-4 block">{intent.category || 'General'}</span>
                   <h3 className="text-xl md:text-3xl font-serif font-black text-[var(--color-text-primary)] leading-[1.15] line-clamp-3 group-hover:text-[var(--color-accent)] transition-colors">
                     {intent.title}
                   </h3>
                </div>

                <div className="mt-8 space-y-6 relative z-10">
                   <div className="flex items-center gap-4 text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-2">
                         <MapPin size={14} className="text-[var(--color-accent)]" />
                         <span className="text-[10px] uppercase font-bold tracking-widest">{intent.location || 'Remote'}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                         <Clock size={14} />
                         <span className="text-[10px]">{intent.created_at ? new Date(intent.created_at).toLocaleDateString() : 'Now'}</span>
                      </div>
                   </div>
                   
                   <div className="pt-8 border-t border-[var(--color-border)] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <Avatar 
                           name={intent.created_by && typeof intent.created_by === 'object' ? (intent.created_by as any).name : 'Member'}
                           src={intent.created_by && typeof intent.created_by === 'object' && (intent.created_by as any).avatar_url ? storageService.getPublicUrl((intent.created_by as any).avatar_url) : undefined}
                           size="sm"
                         />
                         <div>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Lead</p>
                            <p className="text-[10px] font-bold">{intent.created_by && typeof intent.created_by === 'object' ? ((intent.created_by as any).name || 'Member') : 'Member'}</p>
                         </div>
                      </div>
                      <Badge variant="sage" className="text-[9px] font-black bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)]">
                        {intent.status === 'looking' ? 'Open' : 'Active'}
                      </Badge>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-2 border-dashed border-[var(--color-border)] rounded-[3rem]">
            <h3 className="text-2xl font-serif font-light italic text-[var(--color-text-secondary)]">No collaborations found...</h3>
          </div>
        )}
      </div>
    </Layout>
  )
}
