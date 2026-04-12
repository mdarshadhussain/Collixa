'use client'

import { useState } from 'react'
import { Search, Star, MapPin, Briefcase, Filter, ArrowRight, RefreshCw } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Card from '@/components/Card'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useTheme } from '@/app/context/ThemeContext'

const mockSkills = [
  {
    id: 1,
    name: 'Sarah Anderson',
    title: 'Full Stack Developer',
    location: 'San Francisco, CA',
    hourlyRate: '$85/hour',
    rating: 4.9,
    reviews: 127,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    availability: 'Available Now',
    topSkills: [
      { name: 'React', level: 'Expert' },
      { name: 'Node.js', level: 'Expert' },
      { name: 'TypeScript', level: 'Intermediate' },
    ],
  },
  {
    id: 2,
    name: 'Michael Chen',
    title: 'UI/UX Designer',
    location: 'New York, NY',
    hourlyRate: '$75/hour',
    rating: 4.8,
    reviews: 95,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    skills: ['Figma', 'UI Design', 'Prototyping', 'User Research'],
    availability: 'Available in 2 weeks',
    topSkills: [
      { name: 'UI Design', level: 'Expert' },
      { name: 'Figma', level: 'Expert' },
      { name: 'Prototyping', level: 'Intermediate' },
    ],
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    title: 'Data Scientist',
    location: 'Austin, TX',
    hourlyRate: '$95/hour',
    rating: 5.0,
    reviews: 83,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    availability: 'Available Now',
    topSkills: [
      { name: 'Machine Learning', level: 'Expert' },
      { name: 'Python', level: 'Expert' },
      { name: 'SQL', level: 'Expert' },
    ],
  },
  {
    id: 4,
    name: 'James Wilson',
    title: 'DevOps Engineer',
    location: 'Seattle, WA',
    hourlyRate: '$90/hour',
    rating: 4.7,
    reviews: 64,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    availability: 'Available Now',
    topSkills: [
      { name: 'Kubernetes', level: 'Expert' },
      { name: 'AWS', level: 'Expert' },
      { name: 'Docker', level: 'Advanced' },
    ],
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    title: 'Content Marketing Specialist',
    location: 'Los Angeles, CA',
    hourlyRate: '$60/hour',
    rating: 4.9,
    reviews: 112,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    skills: ['Content Writing', 'SEO', 'Social Media', 'Analytics'],
    availability: 'Available in 1 week',
    topSkills: [
      { name: 'Content Writing', level: 'Expert' },
      { name: 'SEO', level: 'Expert' },
      { name: 'Social Media', level: 'Intermediate' },
    ],
  },
  {
    id: 6,
    name: 'David Kumar',
    title: 'Mobile Developer',
    location: 'Toronto, Canada',
    hourlyRate: '$80/hour',
    rating: 4.6,
    reviews: 78,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    skills: ['React Native', 'Swift', 'Flutter', 'Firebase'],
    availability: 'Available Now',
    topSkills: [
      { name: 'React Native', level: 'Expert' },
      { name: 'Swift', level: 'Advanced' },
      { name: 'Flutter', level: 'Intermediate' },
    ],
  },
]

export default function SkillsPage() {
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'newest'>('rating')

  const filteredSkills = mockSkills
    .filter((skill) => {
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'price') return parseFloat(a.hourlyRate.replace('$', '')) - parseFloat(b.hourlyRate.replace('$', ''))
      return b.id - a.id
    })

  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen transition-colors duration-700 font-sans">
      <Header />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-8 gap-8">
        
        <Sidebar />

        <main className="flex-1 space-y-12 overflow-y-auto">
          {/* Editorial Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--color-border)] pb-8">
            <div className="space-y-3">
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)]">Directory</span>
               <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tighter italic leading-none">Community.</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">Discover talented collaborators</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="px-6 py-4 bg-[var(--color-accent-soft)]/50 rounded-2xl border border-[var(--color-accent)]/10 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">{filteredSkills.length} Members Found</p>
               </div>
            </div>
          </div>

          {/* Search & Intelligence Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             <div className="lg:col-span-8 group">
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors opacity-40" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, role, or skills..."
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
                    <option value="rating">Sort: Best Rating</option>
                    <option value="price">Sort: Lower Rate</option>
                    <option value="newest">Sort: Newest</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-secondary)] opacity-50">↓</div>
                </div>
             </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSkills.map((skill) => (
              <Card key={skill.id} className="group relative overflow-hidden flex flex-col p-0 bg-[var(--color-bg-secondary)] rounded-[2.5rem] border border-[var(--color-border)] transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--color-accent)]/5 hover:border-[var(--color-accent-soft)]">
                {/* Header Visual */}
                <div className="p-10 flex-1">
                  <div className="flex items-start justify-between mb-8">
                    <div className="relative">
                      <Avatar name={skill.name} src={skill.avatar} size="xl" className="ring-8 ring-[var(--color-accent-soft)]/20 shadow-xl transition-transform group-hover:scale-105" />
                      <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                        {skill.rating}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-50">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < Math.floor(skill.rating) ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : 'text-[var(--color-border)]'}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 mb-10">
                     <div>
                       <h3 className="text-2xl font-serif font-black tracking-tight group-hover:text-[var(--color-accent)] transition-colors">{skill.name}</h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] mt-1.5">{skill.title}</p>
                     </div>
                     
                     <div className="flex flex-wrap gap-4 items-center">
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-50">
                         <MapPin size={14} className="text-[var(--color-accent)]" />
                         {skill.location}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)]">
                         <Briefcase size={14} />
                         {skill.hourlyRate}
                       </div>
                     </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-2 mb-10">
                    {skill.skills.slice(0, 3).map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Progress equivalent */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-4 opacity-40 text-center">Top Skills</p>
                    <div className="space-y-3">
                      {skill.topSkills.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[var(--color-text-primary)]">{s.name}</span>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-1 rounded-md">
                            {s.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Layer */}
                <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/10 group-hover:bg-[var(--color-accent-soft)]/30 transition-colors">
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="w-full py-5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl group-hover:bg-[var(--color-accent)] transition-all flex items-center justify-center gap-4 group/btn shadow-sm"
                  >
                    View Profile
                    <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {filteredSkills.length === 0 && (
            <div className="text-center py-32 border-2 border-dashed border-[var(--color-border)] rounded-[3rem] bg-[var(--color-bg-secondary)]/30">
              <div className="w-20 h-20 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-3xl flex items-center justify-center mx-auto mb-8">
                 <Search size={32} />
              </div>
              <h3 className="text-3xl font-serif italic text-[var(--color-text-primary)]">No members found.</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mt-4">Try adjusting your search filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
