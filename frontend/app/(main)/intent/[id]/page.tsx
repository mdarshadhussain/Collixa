'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AIMatchInsight from '@/components/AIMatchInsight'
import { Intent, User, intentService, conversationService, userService, storageService } from '@/lib/supabase'
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
  FileX2,
  Pencil,
  Star,
  Sparkles,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react'
import Avatar from '@/components/Avatar'
import { motion } from 'framer-motion'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import IntentReviewModal from '@/components/IntentReviewModal'
import ConfirmationModal from '@/components/ConfirmationModal'
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
  const [collaborators, setCollaborators] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [isAccepting, setIsAccepting] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  
  const owner = intent && typeof intent.created_by === 'object' ? (intent.created_by as any) : null
  const isOwner = user && owner && user.id === owner.id
  
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, requestId: string, action: 'accept' | 'reject' | 'join' }>({
    isOpen: false,
    requestId: '',
    action: 'accept'
  })
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchIntent()
    }
  }, [id])

  useEffect(() => {
    if (intent && user) {
      checkExistingRequest()
      fetchCollaborators()

      const statusAllowsRequests = ['pending', 'looking', 'in_progress'].includes(intent.status || '');
      
      if (isOwner && statusAllowsRequests) {
        fetchRequests()
      }
      if (intent.status === 'completed') {
        checkIfReviewed()
      }
    }
  }, [intent, user])

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

  const fetchCollaborators = async () => {
    if (!id) return
    try {
      const data = await intentService.getCollaborators(id as string)
      setCollaborators(data)
    } catch (err) {
      console.error('Failed to fetch collaborators:', err)
    }
  }

  const fetchIntent = async () => {
    try {
      setLoading(true)
      const data = await intentService.getIntentById(id as string)
      setIntent(data)
    } catch (err) {
      console.error('Error fetching intent:', err)
      setIntent(null)
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
    if (!intent || !user) return
    try {
      setIsJoining(true)
      const res = await intentService.requestToJoin(intent.id)
      if (res) {
        notify.success("Request sent to owner!")
        setHasRequested(true)
        setConfirmModal({ ...confirmModal, isOpen: false })
      }
    } catch (err: any) {
      notify.error(err.message || "Failed to send request")
    } finally {
      setIsJoining(false)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      setIsAccepting(requestId)
      const res = await intentService.rejectCollaborationRequest(requestId)
      notify.success(res.message || "Request rejected")
      fetchRequests()
    } catch (err: any) {
      notify.error(err.message || "Failed to reject request")
    } finally {
      setIsAccepting(null)
      setConfirmModal({ ...confirmModal, isOpen: false })
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setIsAccepting(requestId)
      const res = await intentService.acceptCollaborationRequest(requestId)
      notify.success(res.message || "Request accepted!")
      fetchIntent()
      fetchRequests()
      fetchCollaborators()
    } catch (err: any) {
      notify.error(err.message || "Failed to accept request")
    } finally {
      setIsAccepting(null)
      setConfirmModal({ ...confirmModal, isOpen: false })
    }
  }

  const handleConfirmCompletion = async () => {
    if (!user || !intent) return
    try {
      setIsConfirming(true)
      const res = await intentService.confirmCompletion(intent.id as any)
      notify.success(res.message || "Completion confirmed")
      fetchIntent()
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

  const handleStartChat = async (targetId: string) => {
    if (!user) return
    try {
      setIsStartingChat(targetId)
      const conv = await conversationService.getOrCreateDirectConversation(user.id, targetId)
      if (conv) {
        notify.success("Initializing channel...")
        setTimeout(() => router.push(`/chat?id=${conv.id}`), 800)
      }
    } catch (err: any) {
      console.error('Chat error:', err)
      notify.error(`Chat failed: ${err.message || 'Connection error'}`)
    } finally {
      setIsStartingChat(null)
    }
  }

  const handleChatWithOwner = async () => {
    if (!user || !intent) return
    const ownerId = typeof intent.created_by === 'object' ? intent.created_by.id : intent.created_by

    if (ownerId === user.id) {
      notify.info("This is your own intent!")
      return
    }

    await handleStartChat(ownerId)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!intent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border)] rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto my-12">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-serif font-black tracking-tight">Project Abandoned</h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium leading-relaxed">
            The project you're attempting to access has dissolved into the digital ether.
            Check your coordinates or return to the marketplace.
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => router.push('/dashboard')}
          className="px-10 py-4 rounded-2xl mx-auto"
        >
          Back to Marketplace
        </Button>
      </div>
    )
  }

  const isCollaborator = collaborators.some(c => (c.user?.id || c.id) === user?.id)
  const isParticipant = !!user && (isOwner || isCollaborator)
  const hasConfirmed = isOwner ? !!intent?.creator_confirmed_at : !!intent?.collaborator_confirmed_at
  const partnerConfirmed = isOwner ? !!intent?.collaborator_confirmed_at : !!intent?.creator_confirmed_at

  return (
    <>
      <div className="space-y-6 md:space-y-12">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-2 pb-6 md:pt-4 md:pb-12 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">

            {/* Left Column: Essential Details */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">

              {/* Owner Visibility Banners */}
              {isOwner && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {intent.status === 'pending' && (
                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
                        <Clock size={28} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-lg font-serif font-black tracking-tight text-amber-500">Awaiting Admin Review</h4>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mt-1">Your mission is currently being verified by the Collixa Hub. It will appear on the marketplace once approved.</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <Badge variant="accent">{intent.category}</Badge>
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <Clock size={12} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {new Date(intent.created_at || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-l border-[var(--color-border)] pl-4 sm:pl-6">
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <MapPin size={12} className="text-[var(--color-accent)]" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">{intent.location || 'Remote'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <Calendar size={12} className="text-[var(--color-accent)]" />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {intent.timeline
                          ? new Date(intent.timeline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Flexible'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                      <div className={`w-1.5 h-1.5 rounded-full ${intent.status === 'completed' ? 'bg-green-500' : 'bg-[var(--color-accent)]'} animate-pulse`} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {intent.status === 'in_progress' ? 'Active' : intent.status}
                      </span>
                    </div>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-4xl font-serif font-black leading-[1.1] text-[var(--color-text-primary)]">
                  {intent.title}
                </h1>

                <div className="flex flex-wrap gap-6 sm:gap-8 md:gap-12 py-3 md:py-5 border-y border-[var(--color-border)]">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setShowCollaboratorsModal(true)}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                      <Users size={16} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] whitespace-nowrap">Collaborators</p>
                      <p className="text-sm font-serif font-black">
                        {intent.accepted_count || 0} <span className="text-[10px] opacity-40">/ {intent.collaborator_limit || 1}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] whitespace-nowrap">Total Requests</p>
                      <p className="text-sm font-serif font-black">{intent.request_count || 0}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="ml-auto">
                    {!user ? (
                      <Button variant="accent" onClick={() => router.push('/')}>Login to Join</Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {intent.status === 'looking' ? (
                          isParticipant ? (
                            <Button variant="accent" onClick={() => router.push('/chat')}>
                              <MessageCircle size={16} /> Chat Room
                            </Button>
                          ) : (
                            <Button
                              variant="accent"
                              disabled={isJoining || hasRequested}
                              onClick={() => setConfirmModal({ isOpen: true, requestId: String(intent.id), action: 'join' })}
                            >
                              {isJoining ? <Loader2 className="animate-spin" size={16} /> : hasRequested ? "Requested" : "Join Intent"}
                            </Button>
                          )
                        ) : intent.status === 'in_progress' ? (
                          isParticipant ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="accent"
                                className={hasConfirmed ? 'bg-green-500' : ''}
                                onClick={handleConfirmCompletion}
                                disabled={isConfirming || hasConfirmed}
                              >
                                {isConfirming ? <Loader2 className="animate-spin" size={16} /> : hasConfirmed ? "Waiting" : "Finish"}
                              </Button>
                              <Button variant="outline" onClick={() => router.push('/chat')}>
                                <MessageCircle size={18} />
                              </Button>
                            </div>
                          ) : <Badge variant="accent">In Progress</Badge>
                        ) : intent.status === 'completed' ? (
                          isParticipant ? (
                            <Button
                              variant={hasReviewed ? "outline" : "accent"}
                              disabled={hasReviewed}
                              onClick={() => setShowReviewModal(true)}
                            >
                              {hasReviewed ? "Done" : "Review"}
                            </Button>
                          ) : <Badge variant="accent">Completed</Badge>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 p-6 bg-[var(--color-bg-secondary)] rounded-[1.5rem] border border-[var(--color-border)] relative group"
              >
                {isOwner && (
                  <button
                    onClick={() => router.push(`/create?id=${intent.id}`)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center z-10"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <div className="space-y-2">
                  <h3 className="text-base font-serif font-black">Description</h3>
                  <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    {intent.description}
                  </p>
                </div>

                {intent.attachment_name && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-[var(--color-border)]">
                    <img
                      src={storageService.getPublicUrl(intent.attachment_name)}
                      alt={intent.title}
                      className="w-full h-auto max-h-[300px] object-contain bg-[var(--color-bg-primary)] p-2"
                    />
                  </div>
                )}

                {intent.goal && (
                  <div className="space-y-2 p-5 bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                      <Target className="text-[var(--color-accent)]" size={16} />
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em]">Goal</h4>
                    </div>
                    <p className="text-xs text-[var(--color-text-primary)]">{intent.goal}</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {user && (
                <AIMatchInsight
                  type="intent"
                  itemId={String(intent.id)}
                  itemTitle={intent.title}
                  itemDescription={intent.description || ''}
                />
              )}

              {['looking', 'in_progress'].includes(intent.status || '') && isOwner && (
                <div className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] shadow-sm overflow-hidden relative">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">Management Desk</span>
                      <h3 className="text-lg font-serif font-black">Requests</h3>
                    </div>
                    <Badge variant="accent">{requests.filter(r => r.status === 'PENDING').length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {requests.filter(r => r.status === 'PENDING').length === 0 ? (
                      <p className="text-center py-4 text-[10px] opacity-40 italic">No pending nodes...</p>
                    ) : (
                      requests.filter(r => r.status === 'PENDING').map(req => (
                        <div key={req.id} className="p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar src={req.user?.avatar_url ? storageService.getPublicUrl(req.user.avatar_url) : undefined} name={req.user?.name} size="sm" />
                            <div>
                              <p className="text-xs font-black">{req.user?.name}</p>
                              <p className="text-[7px] font-bold text-[var(--color-accent)] uppercase">Lvl {req.user?.level || 1}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setConfirmModal({ isOpen: true, requestId: req.id, action: 'accept' })} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                              <CheckCircle2 size={16} />
                            </button>
                            <button onClick={() => setConfirmModal({ isOpen: true, requestId: req.id, action: 'reject' })} className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {collaborators.length > 0 && (
                <div className="p-6 bg-[var(--color-accent-soft)]/20 border border-[var(--color-accent)]/20 rounded-[2rem]">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em]">Partners</h4>
                    <button onClick={() => setShowCollaboratorsModal(true)} className="text-[8px] font-black uppercase underline tracking-widest opacity-60">View All</button>
                  </div>
                  
                  <div className="space-y-4">
                    {collaborators.slice(0, 3).map((c: any) => (
                      <div key={c.user?.id || c.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.user?.name || c.name} src={c.user?.avatar_url || c.avatar_url ? storageService.getPublicUrl(c.user?.avatar_url || c.avatar_url) : undefined} size="sm" />
                          <div className="flex items-center gap-2">
                            {user?.id !== (c.user?.id || c.id) && (
                              <button 
                                onClick={() => handleStartChat(c.user?.id || c.id)}
                                className="text-[var(--color-accent)] hover:scale-110 transition-transform p-1 rounded-lg bg-[var(--color-accent-soft)]"
                                title="Message Partner"
                              >
                                <MessageCircle size={10} />
                              </button>
                            )}
                            <p className="text-xs font-bold">{c.user?.name || c.name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {collaborators.length > 3 && (
                    <p className="mt-4 text-[9px] font-bold opacity-40 italic">+ {collaborators.length - 3} more collaborators</p>
                  )}
                </div>
              )}

              <div className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem]">
                <h4 className="text-[9px] font-black uppercase tracking-[0.4em] mb-6">Initiated By</h4>
                <div className="flex items-center gap-4">
                  <Avatar name={owner?.name || 'Owner'} src={owner?.avatar_url ? storageService.getPublicUrl(owner.avatar_url) : undefined} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      {user?.id !== (owner?.id || (typeof intent.created_by === 'string' ? intent.created_by : '')) && (
                        <button 
                          onClick={handleChatWithOwner} 
                          className="text-[var(--color-accent)] hover:scale-110 transition-transform p-1 rounded-lg bg-[var(--color-accent-soft)]"
                          title="Message Owner"
                        >
                          <MessageCircle size={14} />
                        </button>
                      )}
                      <p className="text-lg font-serif font-black">{owner?.name || 'Owner'}</p>
                    </div>
                    <Badge variant="outline">{getLevelLabel(owner?.level || 1)}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCollaboratorsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] w-full max-w-md overflow-hidden">
            <div className="p-6 bg-[var(--color-bg-primary)] border-b flex justify-between items-center">
              <h3 className="text-xl font-serif font-black">Collaborators</h3>
              <button onClick={() => setShowCollaboratorsModal(false)} className="text-[10px] font-black uppercase opacity-50">Close</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {collaborators.map((c: any) => (
                <div key={c.user?.id || c.id} className="flex items-center justify-between p-4 bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)]">
                  <div className="flex items-center gap-4">
                    <Avatar src={c.user?.avatar_url ? storageService.getPublicUrl(c.user.avatar_url) : undefined} name={c.user?.name || c.name} size="md" />
                    <p className="text-sm font-bold">{c.user?.name || c.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    loading={isStartingChat === (c.user?.id || c.id)}
                    onClick={async () => {
                      if (!user) return;
                      try {
                        const targetId = c.user?.id || c.id;
                        if (!targetId) throw new Error("Target user ID missing.");
                        setIsStartingChat(targetId);
                        const conv = await conversationService.getOrCreateDirectConversation(user.id, targetId);
                        if (conv) {
                          notify.success("Initializing channel...");
                          setTimeout(() => router.push(`/chat?id=${conv.id}`), 800);
                        }
                      } catch (err: any) {
                        console.error('Chat error:', err);
                        notify.error(`Chat failed: ${err.message || 'Connection error'}`);
                      } finally {
                        setIsStartingChat(null);
                      }
                    }}
                  >
                    <MessageCircle size={12} /> Message
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          if (confirmModal.action === 'accept') handleAcceptRequest(confirmModal.requestId)
          else if (confirmModal.action === 'reject') handleRejectRequest(confirmModal.requestId)
          else if (confirmModal.action === 'join') handleJoinProject()
        }}
        title={
          confirmModal.action === 'accept' ? "Accept Partner?" :
            confirmModal.action === 'reject' ? "Reject Request?" : "Request Partnership?"
        }
        message={
          confirmModal.action === 'accept' ? "Add this partner to your team?" :
            confirmModal.action === 'reject' ? "Permanently remove this request?" : "Send a request to join this project?"
        }
        confirmText={confirmModal.action === 'accept' ? "Accept" : confirmModal.action === 'reject' ? "Reject" : "Send Request"}
        mode={confirmModal.action === 'accept' ? 'success' : confirmModal.action === 'reject' ? 'danger' : 'info'}
        loading={!!isAccepting || isJoining}
      />

      {intent && (
        <IntentReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
          intentTitle={intent.title}
          partnerName={(isOwner ? collaborators[0]?.user?.name : owner?.name) || 'Partner'}
        />
      )}
    </>
  )
}
