'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Star, MapPin, Briefcase, Filter, ArrowRight, RefreshCw, Plus } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Card from '@/components/Card'
import Avatar from '@/components/Avatar'
import { useTheme } from '@/app/context/ThemeContext'
import { skillService } from '@/lib/supabase'
import AddSkillModal from '@/components/AddSkillModal'
import SkillExchangeModal from '@/components/SkillExchangeModal'

export default function SkillsPage() {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'rating' | 'newest'>('newest')
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null)

  const CATEGORIES = ['All', 'Development', 'Design', 'Marketing', 'Data Science', 'Writing', 'Business', 'Other']

  const fetchSkills = useCallback(async () => {
    setLoading(true)
    try {
      const res = await skillService.getSkills(searchQuery, activeCategory)
      if (res.success) {
        setSkills(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeCategory])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSkills()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchSkills])

  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen transition-colors duration-700 font-sans">
      <Header />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 gap-8">
        
        <Sidebar />

        <main className="flex-1 space-y-12 overflow-y-auto">
          {/* Editorial Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--color-border)] pb-8">
            <div className="space-y-3">
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)]">Tribes Directory</span>
               <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tighter italic leading-none">Tribes.</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">Discover talented collaborators</p>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsAddModalOpen(true)}
                 className="flex items-center gap-4 px-8 py-5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-full text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--color-accent)] transition-all shadow-xl group"
               >
                 <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                 List Your expertise
               </button>
            </div>
          </div>

          {/* Search & Intelligence Filters */}
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-8 group">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors opacity-40" size={20} />
                    <input
                      type="text"
                      placeholder="Search by expertise (e.g. React, UI Design)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-16 pr-8 py-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[13px] font-medium focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20 outline-none transition-all placeholder:text-[var(--color-text-secondary)]/30"
                    />
                  </div>
               </div>
               <div className="lg:col-span-4">
                  <div className="relative group">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-accent)] opacity-40 group-focus-within:opacity-100 transition-opacity" size={18} />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full pl-16 pr-8 py-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="newest">Sort: Recently Added</option>
                      <option value="rating">Sort: High Rating</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-secondary)] opacity-50">↓</div>
                  </div>
               </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeCategory === cat 
                      ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-lg shadow-[var(--color-accent)]/20' 
                      : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-[400px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] animate-pulse" />
              ))
            ) : skills.map((skill) => (
              <Card key={skill.id} className="group relative overflow-hidden flex flex-col p-0 bg-[var(--color-bg-secondary)] rounded-[2.5rem] border border-[var(--color-border)] transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--color-accent)]/5 hover:border-[var(--color-accent-soft)]">
                {/* Header Visual */}
                <div className="p-10 flex-1">
                  <div className="flex items-start justify-between mb-8">
                    <div className="relative">
                      <Avatar name={skill.user?.name || 'User'} src={skill.user?.avatar_url} size="xl" className="ring-8 ring-[var(--color-accent-soft)]/20 shadow-xl transition-transform group-hover:scale-105" />
                      <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                        {skill.level}
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40">
                      {skill.category}
                    </span>
                  </div>

                  <div className="space-y-4 mb-10">
                     <div>
                       <h3 className="text-2xl font-serif font-black tracking-tight group-hover:text-[var(--color-accent)] transition-colors">{skill.name}</h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mt-1.5 line-clamp-1">Expertise by {skill.user?.name}</p>
                     </div>
                  </div>

                  {skill.description && (
                    <div className="p-6 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl mb-10">
                       <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)] italic">"{skill.description}"</p>
                    </div>
                  )}

                  {/* Skills tags (If user had multiple, we'd show them, but here it's 1 skill per card) */}
                  <div className="flex items-center gap-3 py-4 border-t border-[var(--color-border)] opacity-50">
                     <span className="text-[8px] font-black uppercase tracking-widest">Active Since</span>
                     <span className="text-[10px] font-bold">{new Date(skill.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Layer */}
                <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/10 group-hover:bg-[var(--color-accent-soft)]/30 transition-colors">
                  <button
                    onClick={() => setSelectedSkill(skill)}
                    className="w-full py-5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl group-hover:bg-[var(--color-accent)] transition-all flex items-center justify-center gap-4 group/btn shadow-sm"
                  >
                    Request Exchange
                    <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {!loading && skills.length === 0 && (
            <div className="text-center py-32 border-2 border-dashed border-[var(--color-border)] rounded-[3rem] bg-[var(--color-bg-secondary)]/30">
              <div className="w-20 h-20 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-3xl flex items-center justify-center mx-auto mb-8">
                 <Search size={32} />
              </div>
              <h3 className="text-3xl font-serif italic text-[var(--color-text-primary)]">No tribes found.</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mt-4">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </main>
      </div>

      <AddSkillModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchSkills} 
      />

      <SkillExchangeModal 
        isOpen={!!selectedSkill} 
        onClose={() => setSelectedSkill(null)} 
        onSuccess={() => alert('Request sent successfully!')}
        skill={selectedSkill}
      />
    </div>
  )
}
