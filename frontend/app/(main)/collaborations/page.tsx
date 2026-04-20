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

  // Filter logic
  const filteredIntents = intents.filter((intent) => {
    const matchesSearch = intent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (intent.description && intent.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = filterCategory === 'All' || 
      (intent.category && intent.category.toLowerCase() === filterCategory.toLowerCase());
    
    return matchesSearch && matchesCategory
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl shadow-[var(--color-accent)]/5 group">
          <div className="space-y-6 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] block mb-2 opacity-60">Intent Portal</span>
            <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tighter leading-[1.1] text-[var(--color-text-primary)]">
              <Typewriter text="Join the best" speed={0.05} delay={0.1} /> <br />
              <span className="italic font-light text-[var(--color-accent)]">
                <Typewriter text="minds together." speed={0.05} delay={0.8} />
              </span>
            </h2>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-3 flex-wrap md:flex-nowrap">
            <div className="relative hidden lg:block mr-2">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                placeholder="Search intents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-[var(--color-accent)] w-72 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={fetchIntents}
              className="p-3 sm:p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-accent-soft)] transition-all text-[var(--color-accent)] shadow-sm"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => router.push('/my-collaborations')}
              className="px-4 sm:px-6 py-3 sm:py-4 border border-[var(--color-accent)] text-[var(--color-accent)] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-lg shadow-[var(--color-accent)]/10"
            >
              My Intents
            </button>
            <button 
              onClick={() => router.push('/create')}
              className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-[var(--color-inverse-bg)] shadow-xl shadow-[var(--color-accent)]/20 rounded-xl"
            >
              Post Intent <Plus size={16} />
            </button>
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
                className="group bg-[var(--color-bg-secondary)] rounded-[2rem] overflow-hidden border-0 hover:shadow-2xl transition-all duration-700 cursor-pointer"
              >
                {/* Card Image */}
                <div className="aspect-[4/3] bg-[var(--color-bg-secondary)] overflow-hidden relative">
                   {intent.attachment_name ? (
                     <img src={storageService.getPublicUrl(intent.attachment_name)} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-black/10 font-serif text-2xl font-black italic bg-[var(--color-bg-secondary)]">COLLIXA</div>
                   )}
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowUpRight size={20} className="text-white drop-shadow-lg" />
                   </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mb-2 block">{intent.category || 'General'}</span>
                   <h3 className="text-lg font-serif font-black text-[var(--color-text-primary)] leading-tight line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors mb-4">
                     {intent.title}
                   </h3>
                   
                   <div className="flex items-center justify-between text-[var(--color-text-secondary)]">
                      <div className="flex items-center gap-2">
                         <MapPin size={12} className="text-[var(--color-accent)]" />
                         <span className="text-[9px] uppercase font-bold tracking-wider">{intent.location || 'Remote'}</span>
                      </div>
                      <Badge variant="sage" className="text-[8px] font-black bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)]">
                        {intent.status === 'looking' ? 'Open' : 'Active'}
                      </Badge>
                   </div>
                </div>
              </div>
            ))}
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
