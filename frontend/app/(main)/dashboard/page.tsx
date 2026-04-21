'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  LayoutDashboard, Users, Zap, ArrowUpRight, TrendingUp, Sparkles, Clock, MapPin, Globe, 
  Activity, Rocket, Bell, Award, Star, Trophy, MessageSquare 
} from 'lucide-react'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { storageService, intentService, sessionService, conversationService, skillService } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/context/AuthContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface HubSections {
  trendingIntents: any[]
  trendingTribes: any[]
  newArrivals: any[]
}

const getLevelInfo = (xp: number = 0) => {
  if (xp >= 3500) return { level: 5, label: 'Master', next: null, currentRange: 3500 }
  if (xp >= 1500) return { level: 4, label: 'Professional', next: 3500, currentRange: 1500 }
  if (xp >= 500) return { level: 3, label: 'Collaborator', next: 1500, currentRange: 500 }
  if (xp >= 100) return { level: 2, label: 'Contributor', next: 500, currentRange: 100 }
  return { level: 1, label: 'Novice', next: 100, currentRange: 0 }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user: authUser, token } = useAuth()
  
  const [sections, setSections] = useState<HubSections | null>(null)
  const [myIntents, setMyIntents] = useState<any[]>([])
  const [pendingConversations, setPendingConversations] = useState<any[]>([])
  const [pendingExchanges, setPendingExchanges] = useState<any[]>([])
  const [activeSessionsCount, setActiveSessionsCount] = useState(0)
  const [recommendations, setRecommendations] = useState<{ intents: any[], partners: any[] } | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)

  const fetchData = async () => {
    if (!authUser) return

    try {
      if (token) {
        setLoadingAI(true)
        fetch(`${API_URL}/api/ai/recommendations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setRecommendations(data)
          setLoadingAI(false)
        })
        .catch(err => {
          console.error('AI Recommendations fetch failed:', err)
          setLoadingAI(false)
        })
      }
      const hubRes = await fetch(`${API_URL}/api/intents/hub/sections`)
      if (hubRes.ok) {
        const hubData = await hubRes.json()
        setSections(hubData.data)
      }

      const [intents, convos, exchangesRes, sessionsRes] = await Promise.all([
        intentService.getUserIntents(authUser.id),
        conversationService.getConversations(authUser.id),
        skillService.getMyExchanges(),
        sessionService.getMySessions()
      ])

      if (intents) setMyIntents(intents)
      
      if (convos) {
        const pending = convos.filter((c: any) => {
          const isP1 = typeof c.participant_1 === 'object' ? c.participant_1.id === authUser.id : c.participant_1 === authUser.id;
          return c.status === 'PENDING' && !isP1;
        }).map((c: any) => {
          const p1 = typeof c.participant_1 === 'object' ? c.participant_1 : null
          const p2 = typeof c.participant_2 === 'object' ? c.participant_2 : null
          const other = p1?.id === authUser.id ? p2 : p1
          return {
            id: c.id,
            name: other?.name || 'User',
            avatar: other?.avatar_url || ''
          }
        })
        setPendingConversations(pending)
      }

      if (exchangesRes && exchangesRes.success) {
        const incoming = exchangesRes.data.filter((ex: any) => ex.status === 'PENDING' && ex.provider_id === authUser.id)
        setPendingExchanges(incoming)
      }

      if (sessionsRes && sessionsRes.success) {
        const active = sessionsRes.data.filter((s: any) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED')
        setActiveSessionsCount(active.length)
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authUser) {
      fetchData()
    }
  }, [authUser])

  if (!authUser) return null

  const totalPendingActionItems = pendingConversations.length + pendingExchanges.length

  return (
    <>
      <div className="max-w-[1500px] mx-auto space-y-12 pb-20 mt-4 px-2 md:px-0">
        
        {/* ─── PERSONAL HUB HERO ─── */}
        <section className="relative overflow-hidden rounded-3xl md:rounded-[3rem] bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] p-8 md:p-14 border border-white/5 shadow-2xl shadow-black/30">
           <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[var(--color-accent)]/30 to-transparent rounded-full blur-[80px] opacity-60 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-start lg:items-center justify-between">
              <div className="flex items-center gap-6">
                  <div className="relative shadow-2xl rounded-full">
                    <Avatar src={authUser.avatar_url || ''} name={authUser.name} size="xl" />
                    <div className="absolute -bottom-2 -right-2 bg-[var(--color-accent)] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-4 border-black">Lvl {authUser.level || 1}</div>
                  </div>
                  <div className="space-y-3">
                     <div>
                        <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tighter leading-none mb-1">
                           Welcome back, <br className="hidden md:block"/>
                           <span className="italic text-[var(--color-accent)]">{authUser.name?.split(' ')[0]}</span>.
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
                           {getLevelInfo(authUser.xp).label} • {authUser.xp || 0} XP
                        </p>
                     </div>
                     
                     {/* XP PROGRESS BAR */}
                     {getLevelInfo(authUser.xp).next && (
                        <div className="w-full max-w-xs space-y-1.5">
                           <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/30">
                              <span>Next Level</span>
                              <span>{Math.round(((authUser.xp || 0) - getLevelInfo(authUser.xp).currentRange) / (getLevelInfo(authUser.xp).next! - getLevelInfo(authUser.xp).currentRange) * 100)}%</span>
                           </div>
                           <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round(((authUser.xp || 0) - getLevelInfo(authUser.xp).currentRange) / (getLevelInfo(authUser.xp).next! - getLevelInfo(authUser.xp).currentRange) * 100)}%` }}
                                className="h-full bg-[var(--color-accent)] shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]"
                              />
                           </div>
                        </div>
                     )}
                  </div>
              </div>

              <div className="flex gap-4 w-full lg:w-auto">
                 <div className="bg-black/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center flex-1 lg:min-w-[140px] hover:bg-black/60 transition-colors cursor-pointer ring-1 ring-[var(--color-accent)]/20 shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.1)]">
                    <Zap size={24} className="text-[var(--color-accent)] mb-3" />
                    <h3 className="text-4xl font-black">{authUser.credits || 0}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">Credits</p>
                 </div>
                 <div className="bg-black/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center flex-1 lg:min-w-[140px] hover:bg-black/60 transition-colors">
                    <Clock size={24} className="text-white/60 mb-3" />
                    <h3 className="text-4xl font-black">{activeSessionsCount}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">Active Sessions</p>
                 </div>
              </div>
            </div>
        </section>

        {/* ─── BENTO BOX ACTION GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* ACTION CENTER - Takes 1 column */}
           <section className="md:col-span-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-2xl font-serif font-black tracking-tight">Action Center</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mt-1">Pending Inputs</p>
                 </div>
                 {totalPendingActionItems > 0 && (
                   <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20">{totalPendingActionItems} New</span>
                 )}
              </div>

              <div className="flex-1 space-y-4">
                  {pendingConversations.map(conv => (
                    <div key={conv.id} className="flex items-center gap-4 bg-[var(--color-bg-primary)] p-4 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-colors group">
                       <Avatar src={conv.avatar} name={conv.name} size="sm" />
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{conv.name}</p>
                          <p className="text-[10px] font-bold text-[var(--color-accent)]">Message Request</p>
                       </div>
                       <button onClick={() => router.push(`/chat`)} className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] p-3 rounded-xl group-hover:bg-[var(--color-accent)] transition-colors"><ArrowUpRight size={16}/></button>
                    </div>
                  ))}
                  {pendingExchanges.map(ex => (
                    <div key={ex.id} className="flex items-center gap-4 bg-[var(--color-bg-primary)] p-4 rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 transition-colors group">
                       <div className="w-10 h-10 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] rounded-full flex items-center justify-center shrink-0">
                          <Users size={16} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">Tribe Exchange</p>
                          <p className="text-[10px] text-[var(--color-text-secondary)] truncate">Needs Attention</p>
                       </div>
                       <button onClick={() => router.push(`/skills`)} className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] p-3 rounded-xl group-hover:bg-[var(--color-accent)] transition-colors"><ArrowUpRight size={16}/></button>
                    </div>
                  ))}
                  {totalPendingActionItems === 0 && (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)]">
                       <div className="w-16 h-16 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center mb-4">
                          <Rocket size={20} className="text-[var(--color-text-secondary)]/50" />
                       </div>
                       <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-secondary)]/50">Inbox Zero</p>
                    </div>
                  )}
              </div>
           </section>

           {/* MY INTENTS & PROGRESS - Takes 2 columns */}
           <section className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {/* My Intents */}
                 <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-center mb-8">
                         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">My Active Intents</h3>
                         <div className="w-10 h-10 rounded-full bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                            <Zap size={16} />
                         </div>
                      </div>
                      {myIntents.length > 0 ? (
                        <div className="space-y-4">
                           {myIntents.filter(i => ['looking', 'in_progress', 'pending'].includes(i.status)).slice(0, 3).map(intent => (
                             <div key={intent.id} className="flex justify-between items-center bg-[var(--color-bg-primary)] p-4 rounded-2xl cursor-pointer hover:border-[var(--color-accent)]/50 border border-transparent transition-colors" onClick={() => router.push(`/intent/${intent.id}`)}>
                                <span className="font-bold text-sm truncate mr-4">{intent.title}</span>
                                <Badge variant="sage" className="text-[9px] font-black uppercase tracking-widest bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] shrink-0 px-3 py-1.5">{intent.status === 'in_progress' ? 'Active' : intent.status}</Badge>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-text-secondary)]/50 font-medium">You don't have any active intents right now.</p>
                      )}
                    </div>
                    <button onClick={() => router.push('/create')} className="mt-8 w-full py-4 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border border-[var(--color-border)] text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all shadow-xl">Create New Intent</button>
                 </div>

                 {/* My Milestone Teaser */}
                 <div className="bg-[var(--color-inverse-bg)] border border-[var(--color-accent)]/20 rounded-[2.5rem] p-8 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 opacity-5"><Trophy size={200} className="text-white" /></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent)]/10 to-transparent pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-6">
                         <Star size={14} className="text-[var(--color-accent)]" />
                         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Current Objective</h3>
                      </div>
                      <p className="text-3xl font-serif font-black italic tracking-tighter text-white mb-6">First Mission</p>
                      <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                         <div className="bg-[var(--color-accent)] h-2 rounded-full shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.8)]" style={{ width: '50%' }}></div>
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Earn 50 Credits</p>
                    </div>
                    <button onClick={() => router.push('/profile')} className="mt-8 w-full py-4 bg-white/5 text-white/80 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm relative z-10 flex items-center justify-center gap-2">View Full Roadmap <ArrowUpRight size={14}/></button>
                 </div>
           </section>
        </div>
        
        {/* ─── AI PERSONALIZED RECOMMENDATIONS ─── */}
        <section className="pt-4 px-2 lg:px-0">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[var(--color-accent-soft)]/20 rounded-xl">
                  <Sparkles size={24} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tighter">Personalized for You</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">AI-Powered matching based on your interests</p>
                </div>
              </div>
           </div>

           {loadingAI && !recommendations ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-[var(--color-bg-secondary)]/50 rounded-3xl animate-pulse" />
                ))}
             </div>
           ) : recommendations && (recommendations.intents.length > 0 || recommendations.partners.length > 0) ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.intents.map((intent: any, i: number) => (
                  <motion.div 
                    key={`rec-intent-${intent.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => router.push(`/intent/${intent.id}`)}
                    className="group bg-[var(--color-bg-secondary)] border border-[var(--color-accent)]/10 p-6 rounded-[2.5rem] hover:border-[var(--color-accent)]/40 hover:shadow-2xl hover:shadow-[var(--color-accent)]/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 p-4">
                        <div className="bg-[var(--color-accent)] text-black text-[8px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                           <Sparkles size={10} /> 95% Match
                        </div>
                     </div>
                     <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mb-3 block">{intent.category || 'Potential Fit'}</span>
                     <h3 className="text-xl font-serif font-black leading-tight mb-4 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">{intent.title}</h3>
                     <div className="flex items-center gap-3">
                        <Avatar size="sm" src={storageService.getPublicUrl(intent.creator_avatar)} name={intent.creator_name} />
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-60">Created by {intent.creator_name}</div>
                     </div>
                  </motion.div>
                ))}

                {recommendations.partners.map((partner: any, i: number) => (
                  <motion.div 
                    key={`rec-partner-${partner.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i + 3) * 0.1 }}
                    onClick={() => router.push(`/profile?uid=${partner.user_id}`)}
                    className="group bg-[var(--color-inverse-bg)] border border-white/5 p-6 rounded-[2.5rem] hover:border-[var(--color-accent)]/40 transition-all cursor-pointer relative overflow-hidden flex items-center gap-4"
                  >
                     <div className="absolute top-2 right-4">
                        <span className="text-[6px] font-black uppercase tracking-widest text-[var(--color-accent)]">Suggested Partner</span>
                     </div>
                     <Avatar size="lg" src={partner.user?.avatar_url} name={partner.user?.name} className="ring-2 ring-[var(--color-accent)]/30 group-hover:ring-[var(--color-accent)] transition-all" />
                     <div>
                        <h3 className="text-lg font-serif font-black text-white leading-tight">{partner.user?.name}</h3>
                        <p className="text-[9px] font-bold text-[var(--color-accent)] uppercase tracking-widest mt-1">Specialist in {partner.name}</p>
                        <div className="flex gap-1 mt-2">
                           {[1, 2, 3].map(s => <Star key={s} size={8} className="text-yellow-500 fill-yellow-500" />)}
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)] p-12 rounded-[3rem] text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-6">
                   <Users size={24} />
                </div>
                <h3 className="text-2xl font-serif font-black italic mb-3 text-[var(--color-text-primary)]">Unlock Your Potential.</h3>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed mb-8 px-4">
                   Our AI matches you with the best collaborators and projects based on your interests. Currently, your profile is thin on details!
                </p>
                <button 
                  onClick={() => router.push('/profile')}
                  className="px-8 py-4 bg-[var(--color-accent)] text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:scale-105 transition-all shadow-xl"
                >
                   Complete Your Profile
                </button>
             </div>
           )}
        </section>

        {/* ─── DISCOVERY SECTION (Explore Hub) ─── */}
        <section className="pt-12">
            <div className="flex items-center gap-4 mb-10 px-2 lg:px-0">
              <CompassIcon size={24} className="text-[var(--color-accent)]" />
              <div>
                <h2 className="text-3xl font-serif font-black tracking-tighter">Explore the Network</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1">Trending Intents & Fresh Arrivals</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {sections?.newArrivals.slice(0, 4).map((intent, i) => (
                <motion.div 
                  key={intent.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/intent/${intent.id}`)}
                  className="group bg-[var(--color-bg-secondary)] rounded-[2rem] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:shadow-2xl hover:shadow-[var(--color-accent)]/5 transition-all duration-500 cursor-pointer flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[var(--color-bg-primary)] overflow-hidden relative">
                    {intent.attachment_name ? (
                      <img src={storageService.getPublicUrl(intent.attachment_name)} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" alt={intent.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]/20 font-serif text-3xl font-black italic bg-[var(--color-bg-secondary)]">C X</div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowUpRight size={16} className="text-white" />
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mb-3 block">{intent.category || 'General'}</span>
                      <h3 className="text-lg font-serif font-black text-[var(--color-text-primary)] leading-tight line-clamp-2 group-hover:text-[var(--color-accent)] transition-colors mb-auto">
                        {intent.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-[var(--color-text-secondary)] mt-6 pt-4 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-[var(--color-accent)]" />
                            <span className="text-[9px] uppercase font-bold tracking-widest">{intent.location?.split(',')[0] || 'Remote'}</span>
                        </div>
                      </div>
                  </div>
                </motion.div>
              ))}
            </div>
        </section>

      </div>
    </>
  )
}

function CompassIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}
