'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { Intent, intentService, conversationService, userService, storageService } from '@/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { 
  MessageSquare, 
  Users, 
  MapPin, 
  Calendar, 
  Target, 
  Plus, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  Briefcase,
  Avatar as AvatarIcon
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import { motion } from 'framer-motion'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import { notify } from '@/lib/utils'

export default function IntentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [intent, setIntent] = useState<Intent | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestSending, setRequestSending] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)

  useEffect(() => {
    if (id) {
      fetchIntent()
    }
  }, [id])

  useEffect(() => {
    if (intent && user) {
       checkExistingRequest()
    }
  }, [intent, user])

  const fetchIntent = async () => {
    try {
      setLoading(true)
      const data = await intentService.getIntentById(id as string)
      setIntent(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingRequest = async () => {
     if (!user || !intent) return
     try {
        const { data } = await intentService.getExistingRequest(user.id, intent.id as any)
        if (data) setHasRequested(true)
     } catch (err) {
        console.error(err)
     }
  }

  const handleJoinProject = async () => {
    if (!user || !intent) return
    try {
      setRequestSending(true)
      await intentService.joinProject(intent.id as any, user.id)
      setHasRequested(true)
      notify.success("Joined successfully! You can now access the intent chat.")
      router.push('/chat')
    } catch (err: any) {
      notify.error(err.message || "Failed to join intent")
    } finally {
      setRequestSending(false)
    }
  }

  const handleChatWithOwner = async () => {
    if (!user || !intent) return
    const ownerId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by
    
    if (ownerId === user.id) {
       notify.info("This is your own intent!")
       return
    }

    try {
      const conversation = await conversationService.getOrCreateDirectConversation(user.id, ownerId)
      if (conversation) {
        router.push('/chat')
      } else {
        notify.error("Failed to create conversation. Check browser console for details.")
      }
    } catch (err: any) {
      console.error('Chat with owner error:', err)
      notify.error(`Failed to open chat: ${err.message || 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[var(--color-bg-primary)]">
        <Sidebar activePage="dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!intent) {
    return (
      <div className="flex h-screen bg-[var(--color-bg-primary)]">
        <Sidebar activePage="dashboard" />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <FileX2 size={64} className="mx-auto text-[var(--color-text-secondary)] opacity-20" />
          <h2 className="text-2xl font-serif">Intent not found</h2>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  const owner = typeof intent.created_by === 'object' ? intent.created_by : null
  const isOwner = user?.id === owner?.id

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
      <Sidebar activePage="dashboard" />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <Header />
        
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 md:py-12 md:px-12">
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors mb-6 md:mb-12"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
            
            {/* Left Column: Essential Details */}
            <div className="lg:col-span-2 space-y-6 md:space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                   <Badge variant="accent">{intent.category}</Badge>
                   <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <Clock size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Posted {new Date(intent.created_at || '').toLocaleDateString()}
                      </span>
                   </div>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-7xl font-serif font-black leading-[1.1] text-[var(--color-text-primary)]">
                  {intent.title}
                </h1>

                <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 py-4 md:py-6 border-y border-[var(--color-border)]">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)]">
                         <MapPin size={18} />
                      </div>
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Location</p>
                         <p className="text-xs sm:text-sm font-bold">{intent.location || 'Remote'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                         <Target size={18} />
                      </div>
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Timeline</p>
                         <p className="text-xs sm:text-sm font-bold">{intent.timeline || 'Flexible'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)]">
                         <Briefcase size={18} />
                      </div>
                      <div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Status</p>
                         <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[var(--color-accent)]">{intent.status}</p>
                      </div>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-5 md:space-y-8 p-4 sm:p-6 md:p-10 bg-[var(--color-bg-secondary)] rounded-2xl md:rounded-[2.5rem] border border-[var(--color-border)] shadow-sm"
              >
                <div className="space-y-4">
                   <h3 className="text-lg md:text-xl font-serif font-black">Description</h3>
                   <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] font-medium">
                     {intent.description}
                   </p>
                </div>

                {intent.attachment_name && (
                  <div className="mt-6 md:mt-8 rounded-2xl md:rounded-3xl overflow-hidden border border-[var(--color-border)] shadow-xl relative group">
                    <img 
                      src={storageService.getPublicUrl(intent.attachment_name)} 
                      alt={intent.title} 
                      className="w-full h-auto max-h-[500px] object-contain bg-[var(--color-bg-primary)] p-2"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-3xl"></div>
                  </div>
                )}

                {intent.goal && (
                  <div className="space-y-3 md:space-y-4 p-4 sm:p-6 md:p-8 bg-[var(--color-bg-primary)] rounded-2xl md:rounded-3xl border border-[var(--color-border)]">
                     <div className="flex items-center gap-3 mb-4">
                        <Target className="text-[var(--color-accent)]" size={20} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Intent Goal</h4>
                     </div>
                     <p className="text-xs sm:text-sm text-[var(--color-text-primary)] font-medium">{intent.goal}</p>
                  </div>
                )}
              </motion.div>
            </div>

             {/* Right Column: Interaction & Social */}
             <div className="space-y-4 md:space-y-8">
                
                {/* Actions Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 sm:p-6 md:p-10 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-[var(--color-accent)]/20 overflow-hidden relative"
                >
                   <div className="relative z-10 space-y-5 md:space-y-8">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Ready to join?</p>
                         <h3 className="text-2xl md:text-3xl font-serif font-bold italic underline decoration-[var(--color-accent)] decoration-2">Get Involved.</h3>
                      </div>

                      <div className="space-y-4">
                        {/* GUEST VIEW */}
                        {!user && (
                          <Button 
                            variant="accent" 
                            fullWidth 
                            className="py-4 md:py-6 rounded-xl md:rounded-2xl shadow-lg"
                            onClick={() => router.push('/')}
                          >
                            Login to Participate
                          </Button>
                        )}

                        {/* COLLABORATOR VIEW (Logged in, Not Owner) */}
                        {user && !isOwner && (
                          <>
                            <Button 
                              variant="accent" 
                              fullWidth 
                              className="py-4 md:py-6 rounded-xl md:rounded-2xl shadow-lg w-full flex items-center justify-center gap-2"
                              onClick={handleJoinProject}
                              disabled={isJoining || hasRequested}
                            >
                              {isJoining ? (
                                <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Joining...</span>
                              ) : hasRequested ? (
                                <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Request Sent</span>
                              ) : (
                                <span className="flex items-center gap-2"><Plus size={16}/> Join Intent</span>
                              )}
                            </Button>
                            <Button 
                              variant="outline" 
                              fullWidth 
                              className="py-4 md:py-6 rounded-xl md:rounded-2xl border-white/20 text-white hover:bg-[var(--color-bg-secondary)]/10"
                              onClick={handleChatWithOwner}
                            >
                              <span className="flex items-center gap-2"><MessageSquare size={16} /> Chat with Owner</span>
                            </Button>
                          </>
                        )}
                        
                        {/* OWNER VIEW (Logged in, Is Owner) */}
                        {user && isOwner && (
                          <div className="space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-center opacity-70 mb-2">This is your intent</p>
                            <Button 
                              variant="accent" 
                              fullWidth 
                              className="py-4 md:py-6 rounded-xl md:rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-white"
                              onClick={() => router.push('/chat')}
                            >
                               <MessageCircle size={16} />
                               Open Intent Chat
                            </Button>
                            <Button 
                              variant="outline" 
                              fullWidth 
                              className="py-3 md:py-4 rounded-xl md:rounded-2xl border-white/20 text-white hover:bg-[var(--color-bg-secondary)]/10 text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
                              onClick={() => router.push(`/create?id=${intent.id}`)}
                            >
                               <Settings size={16} />
                               Edit Intent
                            </Button>
                          </div>
                        )}
                      </div>
                   </div>

                   {/* Aesthetic backgrounds */}
                   <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-[var(--color-accent)] opacity-10 rounded-full blur-3xl"></div>
                </motion.div>

               {/* Owner Card */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="p-4 sm:p-6 md:p-10 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[2.5rem]"
               >
                  <h4 className="text-[9px] font-black uppercase tracking-[0.28em] md:tracking-[0.4em] text-[var(--color-text-secondary)] mb-5 md:mb-8">Initiated By</h4>
                  <div className="flex items-center gap-4">
                     <Avatar 
                        name={owner?.name || 'Owner'} 
                        src={owner?.avatar_url ? storageService.getPublicUrl(owner.avatar_url) : undefined} 
                        size="lg" 
                        className="rounded-2xl shrink-0" 
                     />
                     <div>
                        <p className="text-lg md:text-xl font-serif font-bold">{owner?.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">{owner?.email}</p>
                     </div>
                  </div>
               </motion.div>

               {/* Stats Card */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3 }}
                 className="p-4 sm:p-6 md:p-10 bg-[var(--color-accent-soft)] border border-[var(--color-accent)]/10 rounded-2xl md:rounded-[2.5rem] flex justify-between items-center"
               >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)]">Collaborators</p>
                    <div className="flex items-center gap-2">
                       <Users size={16} className="text-[var(--color-accent)]" />
                       <span className="text-xl md:text-2xl font-serif font-black">{intent.accepted_count || 0}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)]">Requests</p>
                    <span className="text-xl md:text-2xl font-serif font-black">{intent.request_count || 0}</span>
                  </div>
               </motion.div>

            </div>

          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
