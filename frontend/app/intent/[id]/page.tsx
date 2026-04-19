'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import AIMatchInsight from '@/components/AIMatchInsight'
import BottomNav from '@/components/BottomNav'
import { Intent, intentService, conversationService, userService, storageService } from '@/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { 
  MessageSquare, 
  MessageCircle,
  Users, 
  MapPin, 
  Calendar, 
  Target, 
  Plus, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  Briefcase,
  Avatar as AvatarIcon,
  FileX2,
  Settings,
  Sparkles,
  Loader2
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import { motion } from 'framer-motion'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import IntentReviewModal from '@/components/IntentReviewModal'
import { notify } from '@/lib/utils'

const getLevelLabel = (level: number) => {
  const labels: Record<number, string> = {
    1: 'Novice',
    2: 'Contributor',
    3: 'Collaborator',
    4: 'Professional',
    5: 'Master'
  }
  return labels[level] || 'Novice'
}

export default function IntentDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const [intent, setIntent] = useState<Intent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [hasRequested, setHasRequested] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [collaborator, setCollaborator] = useState<User | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [isAccepting, setIsAccepting] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  // AI Match states removed as they are now in AIMatchInsight component

  useEffect(() => {
    if (id) {
      fetchIntent()
    }
  }, [id])

  useEffect(() => {
    if (intent && user) {
       checkExistingRequest()
       // fetchMatchInsight removed as it is now in AIMatchInsight component
       if (intent.collaborator_id) {
          fetchCollaborator(intent.collaborator_id)
       }
       
       const ownerId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by
        if (user.id === ownerId && intent.status === 'looking') {
           fetchRequests()
        }
        if (intent.status === 'completed') {
           checkIfReviewed()
        }
    }
  }, [intent, user])

  // fetchMatchInsight removed as it is now in AIMatchInsight component

  const checkIfReviewed = async () => {
    if (!user || !intent) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews/user/${intent.collaborator_id || ''}`)
      const data = await response.json()
      if (data.success) {
        const alreadyReviewed = data.data.some((r: any) => r.intent_id === intent.id && r.reviewer_id === user.id)
        setHasReviewed(alreadyReviewed)
      }
    } catch (err) {
      console.error('Failed to check review status:', err)
    }
  }

  const fetchCollaborator = async (collaboratorId: string) => {
     try {
        const data = await userService.getUser(collaboratorId)
        setCollaborator(data)
     } catch (err) {
        console.error('Failed to fetch collaborator:', err)
     }
  }

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

  const fetchRequests = async () => {
    if (!id) return
    try {
      const data = await intentService.getCollaborationRequests(id as string)
      setRequests(data)
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    }
  }

  const handleJoinProject = async () => {
    if (!user || !intent) return
    try {
      setIsJoining(true)
      await intentService.joinProject(intent.id as any, user.id)
      setHasRequested(true)
      notify.success("Joined successfully! You can now access the intent chat.")
      fetchIntent() // Refresh state
    } catch (err: any) {
      notify.error(err.message || "Failed to join intent")
    } finally {
      setIsJoining(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setIsAccepting(requestId)
      const res = await intentService.acceptCollaborationRequest(requestId)
      notify.success(res.message || "Request accepted!")
      fetchIntent() 
    } catch (err: any) {
      notify.error(err.message || "Failed to accept request")
    } finally {
      setIsAccepting(null)
    }
  }

  const handleConfirmCompletion = async () => {
    if (!user || !intent) return
    try {
      setIsConfirming(true)
      const res = await intentService.confirmCompletion(intent.id as any)
      notify.success(res.message || "Completion confirmed")
      fetchIntent() // Refresh for state change
    } catch (err: any) {
      notify.error(err.message || "Failed to confirm completion")
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user || !intent) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          intentId: intent.id,
          rating,
          comment
        })
      })

      let data;
      try {
        data = await response.json()
      } catch (e) {
        // Fallback for non-JSON response
        if (!response.ok) {
          throw new Error(`Server returned error ${response.status}: ${response.statusText}`)
        }
        throw new Error("Invalid response format from server")
      }

      if (response.ok) {
        notify.success("Testimonial recorded successfully!")
        setHasReviewed(true)
      } else {
        notify.error(data.error || "Failed to submit feedback")
      }
    } catch (err: any) {
      console.error(err)
      notify.error(err.message || "Connection error while submitting feedback")
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
  const ownerId = owner?.id || (typeof intent.created_by === 'string' ? intent.created_by : null)
  const isOwner = user?.id === ownerId
  const isCollaborator = user?.id === intent.collaborator_id
  const isParticipant = !!user && (isOwner || isCollaborator)

  const hasConfirmed = isOwner ? !!intent.creator_confirmed_at : !!intent.collaborator_confirmed_at
  const partnerConfirmed = isOwner ? !!intent.collaborator_confirmed_at : !!intent.creator_confirmed_at

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
                          <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${intent.status === 'completed' ? 'text-green-500' : 'text-[var(--color-accent)]'}`}>
                            {intent.status === 'in_progress' ? 'In Progress' : intent.status}
                          </p>
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
                
                {/* AI Match Insight Card */}
                 {/* AI Match Insight Card using shared component */}
                 {user && !isOwner && intent.status === 'looking' && (
                    <AIMatchInsight 
                       type="intent" 
                       itemId={intent.id} 
                       itemTitle={intent.title} 
                       itemDescription={intent.description || ''} 
                    />
                 )}
                
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

                        {/* LOGGED IN VIEW */}
                        {user && (
                          <div className="space-y-4">
                            {/* PHASE: LOOKING */}
                            {intent.status === 'looking' && (
                               <div className="space-y-4">
                                  {!isOwner ? (
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
                                          className="py-4 md:py-6 rounded-xl md:rounded-2xl border-white/20 text-white hover:bg-white/5"
                                          onClick={handleChatWithOwner}
                                        >
                                          <span className="flex items-center gap-2"><MessageSquare size={16} /> Chat with Owner</span>
                                        </Button>
                                     </>
                                  ) : (
                                     <>
                                        <Button 
                                          variant="accent" 
                                          fullWidth 
                                          className="py-4 md:py-6 rounded-xl md:rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-white"
                                          onClick={() => router.push('/chat')}
                                        >
                                           <span className="flex items-center gap-2"><MessageCircle size={16} /> Open Intent Chat</span>
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          fullWidth 
                                          className="py-3 md:py-4 rounded-xl md:rounded-2xl border-white/20 text-white hover:bg-white/5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
                                          onClick={() => router.push(`/create?id=${intent.id}`)}
                                        >
                                           <span className="flex items-center gap-2"><Settings size={16} /> Edit Intent</span>
                                        </Button>

                                        {requests.length > 0 && (
                                           <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                                              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Collaboration Requests</p>
                                              <div className="space-y-3">
                                                 {requests.filter((r: any) => ['PENDING', 'ACCEPTED'].includes(r.status)).map((req: any) => (
                                                    <div key={req.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group">
                                                       <div className="flex items-center gap-2">
                                                          <Avatar src={req.user?.avatar_url ? storageService.getPublicUrl(req.user.avatar_url) : undefined} name={req.user?.name} size="xs" />
                                                          <span className="text-xs font-bold truncate max-w-[100px] text-white">{req.user?.name}</span>
                                                       </div>
                                                       <Button 
                                                         variant="accent" 
                                                         className="h-7 text-[8px] font-black uppercase tracking-widest px-3 bg-[var(--color-accent)] text-black hover:scale-105 transition-transform"
                                                         onClick={() => handleAcceptRequest(req.id)}
                                                         disabled={!!isAccepting}
                                                       >
                                                         {isAccepting === req.id ? 'Wait' : 'Accept'}
                                                       </Button>
                                                    </div>
                                                 ))}
                                              </div>
                                           </div>
                                        )}
                                     </>
                                  )}
                               </div>
                            )}

                            {/* PHASE: IN PROGRESS */}
                            {intent.status === 'in_progress' && (
                               <div className="space-y-4">
                                  {isParticipant ? (
                                     <>
                                        <Button 
                                          variant="accent" 
                                          fullWidth 
                                          className={`py-4 md:py-6 rounded-xl md:rounded-2xl shadow-lg border-2 ${hasConfirmed ? 'border-green-500 bg-green-500/10' : 'border-transparent'}`}
                                          onClick={handleConfirmCompletion}
                                          disabled={isConfirming || hasConfirmed}
                                        >
                                          {isConfirming ? (
                                            <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Confirming...</span>
                                          ) : hasConfirmed ? (
                                            <span className="flex items-center gap-2 text-green-500"><CheckCircle2 size={16} /> Waiting for Partner</span>
                                          ) : (
                                            <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Mark as Finished</span>
                                          )}
                                        </Button>
                                        <Button 
                                          variant="accent"
                                          fullWidth 
                                          className="py-4 md:py-6 rounded-xl md:rounded-2xl"
                                          onClick={() => router.push('/chat')}
                                        >
                                          <span className="flex items-center gap-2"><MessageSquare size={16} /> Open Project Chat</span>
                                        </Button>
                                        {partnerConfirmed && !hasConfirmed && (
                                           <p className="text-[10px] text-center font-bold text-green-400 animate-pulse uppercase tracking-widest mt-2">
                                             Partner has signed off!
                                           </p>
                                        )}
                                     </>
                                  ) : (
                                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status</p>
                                        <p className="text-sm font-serif font-black text-[var(--color-accent)] mt-1">IN PROGRESS</p>
                                     </div>
                                  )}
                               </div>
                            )}

                            {/* PHASE: COMPLETED */}
                            {intent.status === 'completed' && (
                              <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-2xl flex flex-col items-center gap-4">
                                 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/40">
                                    <CheckCircle2 size={24} />
                                 </div>
                                 <div className="text-center">
                                    <p className="text-sm font-serif font-black text-green-500 uppercase tracking-widest">Connection Completed</p>
                                    <p className="text-[10px] opacity-70 mt-1 italic text-white/60">5 credits awarded to your vision.</p>
                                 </div>
                                  {isParticipant && !hasReviewed && (
                                    <Button 
                                      variant="outline" 
                                      className="text-[10px] border-white/20 text-white w-full"
                                      onClick={() => setShowReviewModal(true)}
                                    >
                                      Leave Feedback
                                    </Button>
                                  )}
                                  {hasReviewed && (
                                    <p className="text-[10px] font-black uppercase text-green-500/60 tracking-widest mt-2 flex items-center gap-1">
                                      <CheckCircle2 size={12} /> Feedback Sent
                                    </p>
                                  )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                   {/* Aesthetic backgrounds */}
                   <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-[var(--color-accent)] opacity-10 rounded-full blur-3xl"></div>
                </motion.div>

                <IntentReviewModal 
                  isOpen={showReviewModal}
                  onClose={() => setShowReviewModal(false)}
                  onSubmit={handleReviewSubmit}
                  intentTitle={intent.title}
                  partnerName={(isOwner ? collaborator?.name : owner?.name) || 'Partner'}
                />

                {/* Partner Card (If In Progress) */}
                {intent.status !== 'looking' && collaborator && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 sm:p-6 md:p-10 bg-[var(--color-accent-soft)]/30 border border-[var(--color-accent)]/20 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden group"
                  >
                     <div className="absolute top-0 right-0 p-4">
                        <Badge variant="outline" className="border-[var(--color-accent)]/30 text-[var(--color-accent)]">Partner</Badge>
                     </div>
                     <h4 className="text-[9px] font-black uppercase tracking-[0.28em] md:tracking-[0.4em] text-[var(--color-text-secondary)] mb-5 md:mb-8">Collaborating With</h4>
                     <div className="flex items-center gap-4">
                        <Avatar 
                           name={collaborator.name} 
                           src={collaborator.avatar_url ? storageService.getPublicUrl(collaborator.avatar_url) : undefined} 
                           size="lg" 
                           className="rounded-2xl shrink-0 border-2 border-[var(--color-accent)]/20" 
                        />
                        <div>
                           <p className="text-lg md:text-xl font-serif font-black tracking-tight">{collaborator.name}</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mt-1">{collaborator.title || 'Collaborator'}</p>
                        </div>
                     </div>
                     
                     {intent.status === 'in_progress' && (
                        <div className="mt-8 pt-6 border-t border-[var(--color-accent)]/10 flex items-center justify-between">
                           <div className="flex items-center gap-2 text-[var(--color-accent)]">
                              <div className={`w-2 h-2 rounded-full ${partnerConfirmed ? 'bg-green-500' : 'bg-[var(--color-accent)] animate-pulse'}`} />
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                                {partnerConfirmed ? 'Partner Ready' : 'Focusing...'}
                              </span>
                           </div>
                           <Button 
                             variant="outline" 
                             className="text-[8px] h-8 border-[var(--color-accent)]/20 text-[var(--color-accent)]"
                             onClick={() => router.push(`/chat`)}
                           >
                             Message
                           </Button>
                        </div>
                     )}
                  </motion.div>
                )}

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
                        <p className="text-lg md:text-xl font-serif font-black tracking-tight">{owner?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <div className="px-2 py-0.5 bg-[var(--color-accent-soft)]/20 border border-[var(--color-accent)]/20 rounded-full">
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)]">Level {owner?.level || 1} • {getLevelLabel(owner?.level || 1)}</span>
                           </div>
                        </div>
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
