'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Zap, ArrowUpRight, TrendingUp, Sparkles, Clock, MapPin, Globe, Activity, Rocket, ShieldCheck, Cpu } from 'lucide-react'
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
    <Layout showSidebar={false}>
      {/* ─── UPLINK TICKER: PLATFORM HEALTH ─── */}
      <div className="max-w-[1500px] mx-auto mb-6">
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full px-6 py-2.5 flex items-center justify-between overflow-hidden backdrop-blur-md">
           <div className="flex items-center gap-6 divide-x divide-[var(--color-border)]">
              <div className="flex items-center gap-2 pr-6">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">System Uplink: Active</span>
              </div>
              <div className="px-6 hidden md:flex items-center gap-2">
                 <Cpu size={12} className="text-[var(--color-accent)]" />
                 <span className="text-[9px] font-bold uppercase tracking-tighter">Match Velocity: 4.2h Avg</span>
              </div>
              <div className="px-6 hidden lg:flex items-center gap-2">
                 <ShieldCheck size={12} className="text-[var(--color-accent)]" />
                 <span className="text-[9px] font-bold uppercase tracking-tighter">Verification Rate: 98.4%</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] underline decoration-2 underline-offset-4 cursor-pointer">Live Updates</span>
           </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto space-y-16 pb-20">
        
        {/* ─── INSIGHT HERO: BIRDS EYE VIEW ─── */}
        <section className="relative overflow-hidden rounded-[3rem] bg-[var(--color-text-primary)] text-white p-10 md:p-16 border border-white/5 shadow-2xl shadow-black/30">
           <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/20 to-transparent opacity-40" />
           
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
                       Marketplace
                    </button>
                    <button 
                      onClick={() => router.push('/my-collaborations')}
                      className="px-8 py-4 bg-white/5 text-white border border-white/10 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all font-sans"
                    >
                       My Projects
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
                    <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">Trending Collaborations</h2>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40">High-velocity engagement zones</p>
                  </div>
                  <button onClick={() => router.push('/collaborations')} className="group flex items-center gap-3 text-[9px] font-black uppercase tracking-widest hover:text-[var(--color-accent)] transition-colors">
                     Discover More <ArrowUpRight size={14} />
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
                      className="group bg-white border border-[var(--color-border)] p-6 rounded-[2.5rem] hover:shadow-2xl hover:border-[var(--color-accent)] transition-all cursor-pointer flex flex-col h-full"
                    >
                      <div className="aspect-[4/3] bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden mb-5 shrink-0 relative">
                         {intent.attachment_name ? (
                           <img src={storageService.getPublicUrl(intent.attachment_name)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-black/5 font-serif text-3xl font-black italic">COLLIXA</div>
                         )}
                         <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 flex items-center gap-1.5">
                            <TrendingUp size={10} className="text-[var(--color-accent)]" />
                            <span className="text-[9px] font-black">TOP</span>
                         </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <Badge variant="sage" className="bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border-none text-[8px] font-black uppercase px-4 py-1">
                             {intent.category}
                        </Badge>
                        <h4 className="text-lg font-serif font-black text-[var(--color-text-primary)] leading-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">{intent.title}</h4>
                      </div>
                      <div className="pt-5 mt-5 border-t border-[var(--color-border)] flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <Avatar name={intent.created_by?.name} src={intent.created_by?.avatar_url ? storageService.getPublicUrl(intent.created_by.avatar_url) : undefined} size="sm" />
                           <span className="text-[9px] font-bold text-[var(--color-text-secondary)] truncate max-w-[80px]">{intent.created_by?.name.split(' ')[0]}</span>
                         </div>
                         <div className="text-right">
                           <p className="text-[10px] font-black text-[var(--color-text-primary)]">{(intent.requests?.[0]?.count || 0) + 12}</p>
                           <p className="text-[7px] font-black uppercase tracking-tighter opacity-40">Impact</p>
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
                      className="group bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-8 rounded-[3rem] hover:shadow-2xl hover:bg-white hover:border-[var(--color-accent)] transition-all cursor-pointer flex flex-col items-center text-center space-y-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors overflow-hidden">
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
                      <div className="flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {[1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-[var(--color-bg-secondary)] bg-gray-200" />)}
                         </div>
                         <span className="text-[9px] font-bold opacity-40">+124 Joined</span>
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
                      className="group bg-white border border-[var(--color-border)] p-6 rounded-[2.5rem] hover:shadow-2xl hover:border-[var(--color-accent-soft)] transition-all cursor-pointer space-y-4 flex flex-col"
                    >
                      <div className="aspect-[4/3] bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden mb-1">
                        {intent.attachment_name ? (
                          <img src={storageService.getPublicUrl(intent.attachment_name)} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black/5 font-serif text-3xl font-black">COLLIXA</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] opacity-60 mb-2 block">{intent.category}</span>
                        <h4 className="text-lg font-serif font-bold text-[var(--color-text-primary)] leading-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">{intent.title}</h4>
                      </div>
                      <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <MapPin size={10} className="text-[var(--color-accent)]" />
                           <span className="text-[8px] font-bold uppercase tracking-wider truncate max-w-[80px]">{intent.location || 'Remote'}</span>
                         </div>
                         <span className="text-[8px] font-bold opacity-30">{new Date(intent.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
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
