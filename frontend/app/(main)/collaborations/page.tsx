'use client'

import { Search, Plus, RefreshCw, ArrowUpRight, MapPin, Clock } from 'lucide-react'
import Badge from '@/components/Badge'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Intent, intentService, storageService } from '@/lib/supabase'
import Typewriter from '@/components/Typewriter'

const CATEGORIES = ['All', 'Intents', 'Study', 'Fitness', 'Travel', 'Events', 'Startup', 'Networking', 'Creative', 'Social', 'Other']
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function IntentsPage() {
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
        setError('Failed to load intents')
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

  // Filter and Sort logic
  const filteredIntents = intents
    .filter((intent) => {
      const matchesSearch = intent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (intent.description && intent.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = filterCategory === 'All' || 
        (intent.category && intent.category.toLowerCase() === filterCategory.toLowerCase());
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      // Priority 1: Status 'looking' and NOT full
      const aIsAvailable = a.status === 'looking' && !(a as any).is_full;
      const bIsAvailable = b.status === 'looking' && !(b as any).is_full;
      
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      
      // Priority 2: Status 'in_progress'
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;

      return 0;
    })

  return (
    <>
      <div className="space-y-6 md:space-y-10">
        
        {/* Search & Actions Mobile */}
        <div className="lg:hidden flex flex-col gap-3">
           <div className="relative">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
             <input
               type="text"
               placeholder="Search intents..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-3.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-xs font-medium focus:ring-1 focus:ring-[var(--color-accent)]"
             />
           </div>
        </div>

        {/* Header Area */}
        <div className="flex flex-col gap-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-[var(--color-accent)]/5 group overflow-hidden relative mt-0">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
             <Plus size={120} className="text-[var(--color-accent)]" />
          </div>
          
          <div className="space-y-2 max-w-none relative z-10">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] block mb-2 opacity-70">Synergy Portal</span>
            <h2 className="text-3xl md:text-6xl font-serif font-black tracking-tighter leading-none text-[var(--color-text-primary)] whitespace-nowrap">
              <Typewriter text="Join the best minds together." speed={0.05} delay={0.1} />
            </h2>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-50">Broadcast your vision. Find your perfect match.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 relative z-10 w-full pt-2">
            <div className="relative w-full md:flex-1 group">
              <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors opacity-40" />
              <input
                type="text"
                placeholder="Search by mission, skill, or goal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={fetchIntents}
                className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-accent-soft)] transition-all text-[var(--color-accent)] shadow-sm group/refresh"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              </button>
              <button 
                onClick={() => router.push('/my-collaborations')}
                className="flex-1 md:flex-none px-8 py-5 border border-[var(--color-accent)] text-[var(--color-accent)] text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-lg shadow-[var(--color-accent)]/5"
              >
                My Intents
              </button>
              <button 
                onClick={() => router.push('/create')}
                className="flex-1 md:flex-none px-8 py-5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-[var(--color-inverse-bg)] shadow-xl shadow-[var(--color-accent)]/20 rounded-2xl group/btn"
              >
                Post Intent <Plus size={18} className="group-hover:rotate-90 transition-transform" />
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
              className={`px-8 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
                filterCategory === cat 
                ? 'bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-[var(--color-inverse-bg)] shadow-lg shadow-[var(--color-text-primary)]/10' 
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] opacity-60 border-[var(--color-border)] hover:opacity-100 hover:border-[var(--color-accent-soft)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content States */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] bg-[var(--color-bg-secondary)] rounded-[2rem] animate-pulse border border-[var(--color-border)]" />
            ))}
          </div>
        ) : filteredIntents.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredIntents.map((intent) => {
               const isInactive = (intent as any).is_full || intent.status === 'completed';
               
               return (
                 <div
                   key={intent.id}
                   onClick={() => router.push(`/intent/${intent.id}`)}
                   className={`group bg-[var(--color-bg-secondary)] rounded-[2rem] overflow-hidden border-0 hover:shadow-2xl transition-all duration-700 cursor-pointer ${isInactive ? 'opacity-80' : ''}`}
                 >
                   {/* Card Image */}
                   <div className="aspect-[4/3] bg-[var(--color-bg-secondary)] overflow-hidden relative">
                      <div className="absolute top-3 left-3 z-10">
                         <span className="bg-[var(--color-accent)] text-black text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-xl">New</span>
                      </div>
                      {intent.attachment_name ? (
                        <img 
                          src={storageService.getPublicUrl(intent.attachment_name)} 
                          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${isInactive ? 'grayscale group-hover:grayscale-0' : ''}`} 
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-black/10 font-serif text-2xl font-black italic bg-[var(--color-bg-secondary)] ${isInactive ? 'grayscale group-hover:grayscale-0' : ''}`}>COLLIXA</div>
                      )}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <ArrowUpRight size={20} className="text-white drop-shadow-lg" />
                      </div>
                   </div>
 
                   {/* Card Content */}
                   <div className="p-4 sm:p-5">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mb-2 block">{intent.category || 'General'}</span>
                      <h3 className="text-base font-serif font-black text-[var(--color-text-primary)] leading-tight line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors mb-4 h-[2.5rem]">
                        {intent.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                          <div className="flex items-center gap-1.5">
                             <MapPin size={10} className="text-[var(--color-accent)]" />
                             <span className="text-[7px] uppercase font-bold tracking-wider truncate max-w-[50px]">{intent.location || 'Remote'}</span>
                          </div>
                         <Badge 
                           variant={intent.status === 'completed' ? 'accent' : (intent as any).is_full ? 'outline' : 'sage'} 
                           className={`text-[8px] font-black ${intent.status === 'completed' ? '' : (intent as any).is_full ? 'border-red-500/50 text-red-500' : 'bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)]'}`}
                         >
                           {intent.status === 'completed' ? 'Completed' : (intent as any).is_full ? 'Full' : intent.status === 'in_progress' ? 'Active' : 'Open'}
                         </Badge>
                      </div>
                   </div>
                 </div>
               );
             })}
          </div>
        ) : (
          <div className="text-center py-40">
            <h3 className="text-2xl font-serif font-light italic text-[var(--color-text-secondary)]">No intents found...</h3>
          </div>
        )}
      </div>
    </>
  )
}
