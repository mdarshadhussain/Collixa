'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Zap, ArrowUpRight, TrendingUp, Sparkles, Clock, MapPin, Globe, Activity, Rocket, Bell } from 'lucide-react'
import Layout from '@/components/Layout'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { storageService } from '@/lib/supabase'
import { motion } from 'framer-motion'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface PlatformStats {
  intents: number
  skills: number
  users: number
  collaborations: number
  insights?: {
    collaborationGrowth: number
    activeUsersTrend: string
    matchSuccessRate: string
  }
}

interface HubSections {
  trendingIntents: any[]
  trendingTribes: any[]
  newArrivals: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [sections, setSections] = useState<HubSections | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [statsRes, hubRes] = await Promise.all([
        fetch(`${API_URL}/api/intents/stats`),
        fetch(`${API_URL}/api/intents/hub/sections`)
      ])
      
      const statsData = await statsRes.json()
      const hubData = await hubRes.json()

      if (statsRes.ok) setStats(statsData.data)
      if (hubRes.ok) setSections(hubData.data)
    } catch (err) {
      console.error('Error fetching hub data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <Layout showSidebar={false}>
        <div className="max-w-[1400px] mx-auto space-y-8 py-6 animate-pulse">
           <div className="h-10 bg-white/5 rounded-full w-1/2 mx-auto mb-8" />
           <div className="h-[300px] bg-white/5 rounded-[3rem] border border-white/10" />
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
           </div>
        </div>
      </Layout>
    )
  }

  const hasData = (stats?.collaborations || 0) > 0 || (sections?.newArrivals.length || 0) > 0

  return (
    <Layout showSidebar={false} showBottomNav={false}>
      <div className="max-w-[1500px] mx-auto space-y-16 pb-20">
        
        {/* ─── INSIGHT HERO: BIRDS EYE VIEW ─── */}
        <section className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-[var(--color-text-primary)] text-white p-10 md:p-16 border border-white/5 shadow-2xl shadow-black/30">
           <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/20 to-transparent opacity-40" />
           
           {/* Notification Icon */}
           <div className="absolute top-6 right-6 z-20">
              <button className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all">
                 <Bell size={18} />
              </button>
           </div>
           
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                 <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                    <Activity size={12} className="text-[var(--color-accent)]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Operational Dashboard</span>
                 </div>
                 <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter leading-[0.95]">
                    The Pulse of <br />
                    <span className="italic font-light text-[var(--color-accent)]">Collixa Intelligence.</span>
                 </h1>
                 <p className="text-lg text-white/50 font-medium max-w-md leading-relaxed">
                    Aggregate platform momentum, community engagement, and marketplace success rates.
                 </p>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => router.push('/collaborations')}
                      className="px-8 py-4 bg-[var(--color-accent)] text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all"
                    >
                       All Intents
                    </button>
                    <button 
                      onClick={() => router.push('/my-collaborations')}
                      className="px-8 py-4 bg-white/5 text-white border border-white/10 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all font-sans"
                    >
                       My Intents
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Collaborations', value: stats?.collaborations, icon: Zap, trend: `+${stats?.insights?.collaborationGrowth}%` },
                   { label: 'Skill Tribes', value: stats?.skills, icon: Globe, trend: 'Global' },
                   { label: 'Active Members', value: stats?.users, icon: Users, trend: stats?.insights?.activeUsersTrend },
                   { label: 'Platform Trust', value: stats?.insights?.matchSuccessRate, icon: Sparkles, trend: 'Verified' },
                 ].map((metric, i) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 15 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     key={metric.label} 
                     className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all border-glow"
                   >
                      <metric.icon size={16} className="text-[var(--color-accent)] mb-4" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{metric.label}</p>
                      <h3 className="text-3xl font-black mb-1">{metric.value ?? '0'}</h3>
                      <span className="text-[9px] font-bold text-[var(--color-accent)]/80">{metric.trend}</span>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* ─── DATA SECTIONS ─── */}
        {hasData ? (
          <div className="space-y-24">
            
            {/* Trending Collaborations (Matches Arrivals Style) */}
            <section className="space-y-10">
               <div className="flex justify-between items-end px-2">
                  <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">Trending Intents</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">High-velocity engagement zones</p>
                  </div>
                  <button onClick={() => router.push('/collaborations')} className="group flex items-center gap-3 text-[9px] font-black uppercase tracking-widest hover:text-[var(--color-accent)] transition-colors">
                     View All Intents <ArrowUpRight size={14} />
                  </button>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {sections?.trendingIntents.map((intent, i) => (
                    <motion.div 
                      key={intent.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/intent/${intent.id}`)}
                      className="group bg-white rounded-[2rem] overflow-hidden border-0 hover:shadow-2xl transition-all duration-700 cursor-pointer"
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
                    </motion.div>
                  ))}
               </div>
            </section>

            {/* Trending Tribes (The missing link) */}
            <section className="space-y-10">
               <div className="flex justify-between items-end px-2">
                  <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">Trending Tribes</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Vibrant interest groups & skill centers</p>
                  </div>
                  <button onClick={() => router.push('/skills')} className="group flex items-center gap-3 text-[9px] font-black uppercase tracking-widest hover:text-[var(--color-accent)] transition-colors">
                     View All Tribes <Users size={14} />
                  </button>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {sections?.trendingTribes.map((tribe, i) => (
                    <motion.div 
                      key={tribe.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/skills?tribe=${tribe.id}`)}
                      className="group bg-white p-8 rounded-[3rem] hover:shadow-2xl hover:bg-white hover:scale-[1.02] transition-all cursor-pointer flex flex-col items-center text-center space-y-4 border-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors overflow-hidden">
                        {tribe.user?.avatar_url ? (
                          <img src={storageService.getPublicUrl(tribe.user.avatar_url)} className="w-full h-full object-cover" />
                        ) : (
                          <Users size={18} />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-serif font-black mb-1 group-hover:text-[var(--color-accent)]">{tribe.name}</h4>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] opacity-60">{tribe.category}</span>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </section>

            {/* Fresh Intake */}
            <section className="space-y-10">
               <div className="flex items-center gap-5 px-2">
                 <div className="w-12 h-12 rounded-2xl bg-[var(--color-text-primary)] flex items-center justify-center text-white shadow-lg">
                    <Rocket size={18} />
                 </div>
                 <div>
                    <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tighter">Fresh Arrivals</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">Brand new on the platform</p>
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {sections?.newArrivals.map((intent, i) => (
                    <motion.div 
                      key={intent.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/intent/${intent.id}`)}
                      className="group bg-white rounded-[2rem] overflow-hidden border-0 hover:shadow-2xl transition-all duration-700 cursor-pointer"
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
                    </motion.div>
                  ))}
               </div>
            </section>
          </div>
        ) : null}

      </div>
      <style jsx global>{`
        .border-glow:hover {
          box-shadow: 0 0 30px -10px rgba(var(--color-accent-rgb), 0.2);
        }
      `}</style>
    </Layout>
  )
}
