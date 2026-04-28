'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Users, 
  Star, 
  BookOpen, 
  Layers, 
  Calendar, 
  MessageCircle, 
  Video, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Send,
  AlertCircle,
  Megaphone,
  X,
  Trash2,
  Edit2,
  Check
} from 'lucide-react'
import { skillService, sessionService, reviewService, conversationService, storageService } from '@/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import Avatar from '@/components/Avatar'
import Badge from '@/components/Badge'
import Button from '@/components/Button'
import ConfirmationModal from '@/components/ConfirmationModal'
import { notify } from '@/lib/utils'
import AIMatchInsight from '@/components/AIMatchInsight'
import SkillExchangeModal from '@/components/SkillExchangeModal'
import AddSkillModal from '@/components/AddSkillModal'

export default function SkillDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [skill, setSkill] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null)
  const [selectedSkillForRequest, setSelectedSkillForRequest] = useState<any>(null)
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [newNotice, setNewNotice] = useState('')
  const [isPostingNotice, setIsPostingNotice] = useState(false)
  const [isDeletingNotice, setIsDeletingNotice] = useState<string | null>(null)
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [expertSessions, setExpertSessions] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [reviewedSessionIds, setReviewedSessionIds] = useState<string[]>([])
  const [reviewTarget, setReviewTarget] = useState<any | null>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [manageGroupSession, setManageGroupSession] = useState<any | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isOwner = user?.id === skill?.user_id
  const isMember = skill?.members?.some((m: any) => m?.id === user?.id)
  const isParticipant = isOwner || isMember

  const fetchMyReviews = useCallback(async () => {
    if (!user) return
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews/user/${user.id}`)
      const data = await response.json()
      if (response.ok && data.data) {
        const myReviews = data.data.filter((r: any) => r.reviewer_id === user.id)
        setReviewedSessionIds(myReviews.map((r: any) => r.session_id).filter(Boolean))
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    }
  }, [user?.id])

  const fetchTribeData = useCallback(async (skillId: string) => {
    try {
      const [reqsRes, sessionsRes] = await Promise.all([
        skillService.getIncomingRequests(),
        skillService.getUserSessions()
      ])
      if (reqsRes.success) {
        setIncomingRequests(reqsRes.data.filter((r: any) => r.skill_id === skillId))
      }
      if (sessionsRes.success) {
        // Filter sessions for this specific tribe
        const tribeSessions = sessionsRes.data.filter((s: any) => s.exchange?.skill_id === skillId)
        setExpertSessions(tribeSessions)
      }
    } catch (err) {
      console.error('Error fetching tribe data:', err)
    }
  }, [])

  const fetchSkillDetail = useCallback(async () => {
    try {

      const res = await skillService.getSkillDetail(id as string)
      if (res.success) {
        setSkill(res.data)
        // Fetch sessions and requests for the tribe
        fetchTribeData(res.data.id)
        fetchMyReviews()
      } else {
        notify.error(res.error || 'Failed to load tribe details')
      }
    } catch (err) {
      console.error(err)
      notify.error('Connection error')
    } finally {
      setLoading(false)
    }
  }, [id, user?.id, fetchMyReviews, fetchTribeData])

  const handleExchangeStatus = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingId(requestId)
    try {
      const res = await skillService.updateExchangeStatus(requestId, status)
      if (res.success) {
        notify.success(`Request ${status === 'ACCEPTED' ? 'accepted' : 'declined'}!`)
        fetchTribeData(skill.id)
        fetchSkillDetail()
      } else {
        notify.error(res.error || 'Update failed')
      }
    } catch (err) {
      notify.error('Connection error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    setProcessingId(sessionId)
    try {
      const res = await sessionService.completeSession(sessionId)
      if (res.success) {
        if (res.data.status === 'COMPLETED') {
          notify.success('Session completed. Credits updated.')
          setReviewTarget(res.data)
        } else {
          notify.success('Completion confirmed. Waiting for other participant.')
        }
        fetchTribeData(skill.id)
      } else {
        notify.error(res.error || 'Could not complete session')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleCompleteRecurringSession = async (exchangeId: string, scheduledTime: string) => {
    setProcessingId(exchangeId + scheduledTime)
    try {
      const res = await sessionService.completeRecurringSession(exchangeId, scheduledTime)
      if (res.success) {
        if (res.data.status === 'COMPLETED') {
          notify.success('Session completed. Credits updated.')
          setReviewTarget(res.data)
        } else {
          notify.success('Completion confirmed. Waiting for other participant.')
        }
        fetchTribeData(skill.id)
      } else {
        notify.error(res.error || 'Could not complete session')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProcessingId(null)
    }
  }
  const handleSubmitReview = async () => {
    if (!reviewTarget) return
    setSubmittingReview(true)
    try {
      const res = await reviewService.submitReview({
        sessionId: reviewTarget.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      })
      if (res.success) {
        notify.success('Feedback submitted! Growth confirmed.')
        setReviewedSessionIds([...reviewedSessionIds, reviewTarget.id])
        setReviewTarget(null)
        setReviewForm({ rating: 5, comment: '' })
        fetchTribeData(skill.id)
      } else {
        notify.error(res.error || 'Failed to submit review')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingReview(false)
    }
  }

  const renderSessionAction = (session: any, isPopupContext = false) => {
    if (session.type === 'GROUP_SCHEDULED') {
        const targetTime = new Date(session.isoTime).getTime();
        let hasUnconfirmed = true;

        if (skill?.members?.length > 0) {
            const unconfirmedMembers = skill.members.filter((member: any) => {
                const materialized = expertSessions.find(s => 
                    s.exchange?.skill_id === skill?.id && 
                    String(s.sender_id) === String(member.id) &&
                    Math.abs(new Date(s.scheduled_time).getTime() - targetTime) < 60000
                );
                return !materialized || !materialized.receiver_confirmed;
            });
            hasUnconfirmed = unconfirmedMembers.length > 0;
        }

        if (!session.isExpired) {
            return (
                <button 
                  onClick={handleStartClassroom}
                  className="flex-1 py-3 bg-[var(--color-inverse-bg)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Video size={14} /> Start Meeting
                </button>
            );
        } else {
            return (
                <div className="flex gap-2 w-full">
                    <button 
                      disabled
                      className="flex-1 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                    >
                      <Video size={14} /> Meeting Ended
                    </button>
                    <button 
                        onClick={() => setManageGroupSession(session)}
                        className="flex-1 py-3 bg-[var(--color-accent)] text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                        {hasUnconfirmed ? <><CheckCircle2 size={14} /> Mark as Done</> : <><Sparkles size={14} /> Leave Feedback</>}
                    </button>
                </div>
            );
        }
    }

    const isMaterialized = session.id && !session.id.startsWith('teach-slot');
    
    // Determine role based on session IDs or tribe ownership (for virtual slots)
    const sessionTeacherId = session.receiver_id || skill.user_id;
    const isTeacher = user?.id === sessionTeacherId;
    
    const isConfirmedByMe = isTeacher ? session.receiver_confirmed : session.sender_confirmed;
    const isConfirmedByOther = isTeacher ? session.sender_confirmed : session.receiver_confirmed;
    
    const isCompleted = session.status === 'COMPLETED';
    const isReviewedByMe = reviewedSessionIds.includes(session.id);
    
    // If status is WAITING, it means at least one person confirmed.
    const isWaiting = session.status === 'WAITING';
    const isWaitingForFeedback = session.status === 'WAITING_FOR_FEEDBACK';

    if (isCompleted) {
      if (isReviewedByMe) {
        return (
          <div className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
            <CheckCircle2 size={12} /> Session Completed
          </div>
        );
      }
      // If completed but I haven't reviewed, fall through to the feedback button logic
    }

    // FEEDBACK PHASE (Now handles COMPLETED status too)
    if (isWaitingForFeedback || (isConfirmedByMe && isConfirmedByOther) || isCompleted) {
      if (isReviewedByMe) {
        // If we are here, it means the other person hasn't reviewed yet (if status is still WAITING_FOR_FEEDBACK)
        // or it's completed but we just want to show the status.
        return (
          <div className="flex-1 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-[8px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
            <Clock size={12} className="animate-pulse" /> {isCompleted ? 'Awaiting Partner Feedback' : `Waiting for ${isTeacher ? 'Student' : 'Host'} Feedback`}
          </div>
        );
      }
      return (
        <button 
          onClick={() => setReviewTarget(session)}
          className="flex-1 py-3 bg-[var(--color-accent)] text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
        >
          <Sparkles size={12} /> Leave Feedback
        </button>
      );
    }

    // CONFIRMATION PHASE
    if (isConfirmedByMe && !isConfirmedByOther) {
      return (
        <div className="flex-1 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[8px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
          <Clock size={12} className="animate-pulse" /> Waiting for {isTeacher ? 'Student' : 'Host'}
        </div>
      );
    }

    // PENDING/LIVE PHASE
    if (!isConfirmedByMe) {
        if (!session.isExpired && !(!isTeacher && isConfirmedByOther)) {
             return (
                 <button 
                   onClick={handleStartClassroom}
                   className="flex-1 py-3 bg-[var(--color-inverse-bg)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                 >
                   <Video size={14} /> {isTeacher ? 'Start Meeting' : 'Join Meeting'}
                 </button>
             );
        } else {
             return (
                <div className="flex gap-2 w-full">
                    {!isPopupContext && (
                        <button 
                          disabled
                          className="flex-1 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                        >
                          <Video size={14} /> Meeting Ended
                        </button>
                    )}
                    <button 
                        disabled={processingId !== null || (!isMaterialized && !session.exchangeId)}
                        onClick={() => isMaterialized ? handleCompleteSession(session.id) : handleCompleteRecurringSession(session.exchangeId, session.displayTime)}
                        className="flex-1 py-3 border border-[var(--color-border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/5 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {processingId === (isMaterialized ? session.id : (session.exchangeId + (new Date(session.displayTime).toISOString()))) 
                        ? '...' 
                        : (!isMaterialized && !session.exchangeId ? 'Awaiting Members' : (
                            <>
                            <Check size={14} /> Mark Done
                            </>
                        ))}
                    </button>
                </div>
             );
        }
    }

    return null;
};

  // Calculate teaching sessions specifically for this tribe
  const tribeExpertSessions = useMemo(() => {
    if (!skill) return []
    const now = new Date();
    // Materialized sessions that correspond to the schedule
    const materializedIds = new Set();
    const scheduledSlots: any[] = []
    
    // Find the exchange ID for the current user
    let myExchangeId = null;
    if (isMember) {
      myExchangeId = skill.members?.find((m: any) => m.id === user?.id)?.exchange_id;
    } else if (isOwner) {
      myExchangeId = skill.members?.[0]?.exchange_id || null;
    }

    if (skill.schedule && Array.isArray(skill.schedule)) {
      skill.schedule.forEach((slot: any, idx: number) => {
        if (typeof slot === 'object' && slot.date && slot.time) {
          const isoTime = new Date(`${slot.date}T${slot.time}:00`).toISOString();
          const targetTime = new Date(isoTime).getTime();
          const sessionDate = new Date(isoTime);
          
          if (isOwner) {
            // FOR OWNER: Add materialized sessions to the set to prevent manual duplicates
            skill.members?.forEach((member: any) => {
              const materialized = expertSessions.find(s => 
                s.exchange?.skill_id === skill.id && 
                String(s.sender_id) === String(member.id) &&
                Math.abs(new Date(s.scheduled_time).getTime() - targetTime) < 60000
              );
              if (materialized) {
                  materializedIds.add(materialized.id);
              }
            });

            // FOR OWNER: Show one card for the scheduled slot
            const isWithin24HoursPast = sessionDate.getTime() > (now.getTime() - 86400000);
            const isFuture = sessionDate.getTime() > now.getTime();

            if (isFuture || isWithin24HoursPast) {
              scheduledSlots.push({
                id: `teach-slot-group-${skill.id}-${idx}`,
                displayTime: isoTime,
                displayName: `TEACHING: ${skill.name}`,
                type: 'GROUP_SCHEDULED',
                status: 'UPCOMING',
                isExpired: sessionDate.getTime() < (now.getTime() - 7200000),
                slotIdx: idx,
                isoTime: isoTime
              });
            }
          } else {
            // FOR STUDENT: Show only their own card
            const materialized = expertSessions.find(s => 
              s.exchange?.skill_id === skill.id && 
              (s.sender_id === user?.id || s.receiver_id === user?.id) &&
              Math.abs(new Date(s.scheduled_time).getTime() - targetTime) < 60000
            );
            
            if (materialized) {
              materializedIds.add(materialized.id);
              if (materialized.status === 'COMPLETED' && reviewedSessionIds.includes(materialized.id)) return;
              scheduledSlots.push({
                 ...materialized,
                 id: materialized.id,
                 displayName: skill.name,
                 displayTime: isoTime,
                 type: 'SCHEDULED',
                 status: materialized.status
              });
            } else {
              const isWithin24HoursPast = sessionDate.getTime() > (now.getTime() - 86400000);
              const isFuture = sessionDate.getTime() > now.getTime();

              if (isFuture || isWithin24HoursPast) {
                scheduledSlots.push({
                  id: `teach-slot-${skill.id}-${idx}`,
                  exchangeId: myExchangeId,
                  displayName: skill.name,
                  displayTime: isoTime,
                  type: 'SCHEDULED',
                  status: 'UPCOMING',
                  isExpired: sessionDate.getTime() < (now.getTime() - 7200000)
                })
              }
            }
          }
        } else if (typeof slot === 'object' && slot.day && slot.time) {
            // Legacy handling
            scheduledSlots.push({
              id: `teach-slot-legacy-${skill.id}-${idx}`,
              exchangeId: myExchangeId,
              displayName: isOwner ? `TEACHING: ${skill.name}` : skill.name,
              displayTime: slot,
              type: isOwner ? 'GROUP_SCHEDULED' : 'RECURRING',
              status: 'UPCOMING',
              slotIdx: idx,
              isoTime: new Date().toISOString() // Fallback for legacy
            })
        }
      })
    }

    // Manual sessions (sessions in expertSessions that were NOT part of the schedule)
    const unmaterializedSessions = expertSessions.filter((s) => {
       if (materializedIds.has(s.id)) return false;
       return s.status !== 'COMPLETED' || !reviewedSessionIds.includes(s.id);
    });

    const manualSessions: any[] = [];
    if (isOwner) {
       const groupedByTime = new Map();
       unmaterializedSessions.forEach(s => {
           const t = s.scheduled_time;
           if (!groupedByTime.has(t)) groupedByTime.set(t, []);
           groupedByTime.get(t).push(s);
       });

       groupedByTime.forEach((sessions, time) => {
           const sessionDate = new Date(time);
           manualSessions.push({
               id: `teach-slot-group-manual-${time}`,
               displayTime: time,
               displayName: `TEACHING: ${skill.name}`,
               type: 'GROUP_SCHEDULED',
               status: 'UPCOMING',
               isExpired: sessionDate.getTime() < (now.getTime() - 7200000),
               slotIdx: `manual-${time}`,
               isoTime: time
           });
       });
    } else {
       unmaterializedSessions.forEach(s => {
          manualSessions.push({
            ...s,
            type: 'MANUAL',
            displayTime: s.scheduled_time,
            displayName: skill.name,
            isExpired: new Date(s.scheduled_time).getTime() < (now.getTime() - 7200000)
          });
       });
    }

    return [...manualSessions, ...scheduledSlots]
      .sort((a, b) => {
        const timeA = typeof a.displayTime === 'string' ? new Date(a.displayTime).getTime() : 0;
        const timeB = typeof b.displayTime === 'string' ? new Date(b.displayTime).getTime() : 0;
        return timeA - timeB;
      })
  }, [skill, expertSessions, user?.id, reviewedSessionIds])

  useEffect(() => {
    if (id) fetchSkillDetail()
  }, [id, fetchSkillDetail])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!skill) {
    return (
      <div className="text-center py-20 space-y-6">
        <h2 className="text-3xl font-serif font-black">Tribe not found</h2>
        <Button onClick={() => router.push('/skills')}>Back to Network</Button>
      </div>
    )
  }


  const handleStartDirectChat = async (targetUserId: string) => {
    if (!user) return
    try {
      setIsStartingChat(targetUserId)
      const conv = await conversationService.getOrCreateDirectConversation(user.id, targetUserId)
      if (conv) {
        window.location.href = `/chat?id=${conv.id}`
      }
    } catch (err) {
      console.error(err)
      notify.error('Failed to initialize chat')
    } finally {
      setIsStartingChat(null)
    }
  }

  const handlePostNotice = async () => {
    if (!newNotice.trim()) return
    try {
      setIsPostingNotice(true)
      const res = await skillService.createNotice(skill.id, newNotice)
      if (res.success) {
        setNewNotice('')
        setShowNoticeForm(false)
        fetchSkillDetail()
        notify.success('Notice posted successfully')
      }
    } catch (err) {
      console.error(err)
      notify.error('Failed to post notice')
    } finally {
      setIsPostingNotice(false)
    }
  }

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return
    try {
      setIsDeletingNotice(noticeToDelete)
      const res = await skillService.deleteNotice(noticeToDelete)
      if (res.success) {
        fetchSkillDetail()
        notify.success('Notice deleted')
        setNoticeToDelete(null)
      }
    } catch (err) {
      console.error(err)
      notify.error('Failed to delete notice')
    } finally {
      setIsDeletingNotice(null)
    }
  }

  const handleStartClassroom = () => {
    // Generate a consistent room name for this tribe
    const roomName = `CollixaTribe_${skill.id.replace(/-/g, '_')}`
    const jitsiLink = `https://meet.jit.si/${roomName}`
    
    // Update DB with the meeting link if it's missing (for students to find)
    if (isOwner && !skill.meeting_link) {
      skillService.updateSkill(skill.id, { meeting_link: jitsiLink })
    }
    
    window.open(jitsiLink, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 space-y-6">
      {/* Header / Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft size={16} /> Back to Network
        </button>
        
        <div className="flex items-center gap-3">
          {isParticipant && (
            <Button 
              variant="outline" 
              className="rounded-full border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]"
              onClick={() => {
                window.location.href = `/chat?id=${skill.conversation_id || ''}`
              }}
            >
              <MessageCircle size={18} className="mr-2" /> Group Chat
            </Button>
          )}
          {!isParticipant && user && (
            <Button 
              variant="accent" 
              className="rounded-full px-8"
              onClick={() => setSelectedSkillForRequest(skill)}
            >
              Request Entry
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="flex flex-col gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="accent" className="text-[10px] px-3 py-1 shadow-sm">{skill.category}</Badge>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[9px] font-black uppercase tracking-widest opacity-80">
                    <ShieldCheck size={12} className="text-[var(--color-accent)]" />
                    Verified Expertise
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[9px] font-black uppercase tracking-widest opacity-80">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    {skill.avg_rating || '5.0'} ({skill.review_count || 0} Reviews)
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tighter leading-tight max-w-2xl">
                    {skill.name}
                  </h1>
                  {isOwner && (
                    <button 
                      onClick={() => setShowEditModal(true)}
                      className="shrink-0 p-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all shadow-md mt-1"
                      title="Edit Tribe Parameters"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                <p className="text-sm md:text-base text-[var(--color-text-secondary)] italic leading-relaxed max-w-3xl">
                  "{skill.description}"
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Exchange Value Focus Card */}
          <div className="block lg:hidden">
            <div className="p-8 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-xl relative overflow-hidden group shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_1.5rem_4rem_-1rem_rgba(0,0,0,0.3)] cursor-default">
               <div className="absolute top-0 right-0 p-6 opacity-10 -mr-4 -mt-4 transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500">
                  <Sparkles size={80} />
               </div>
               <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Exchange Value</p>
                  <div className="flex items-baseline justify-center gap-1.5 text-[var(--color-bg-primary)]">
                     <span className="text-6xl font-serif font-black leading-none tracking-tighter drop-shadow-md">{skill.session_fee === 0 ? 'FREE' : (skill.session_fee || 20)}</span>
                     {skill.session_fee !== 0 && <span className="text-sm font-black uppercase tracking-widest opacity-90">Creds</span>}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Per Session</p>
               </div>
            </div>
          </div>

          {/* Stats / Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl space-y-1">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-accent)]">
                <Layers size={16} />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Proficiency</p>
              <p className="text-base font-serif font-black">{skill.level}</p>
            </div>
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl space-y-1">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-accent)]">
                <Clock size={16} />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Duration</p>
              <p className="text-base font-serif font-black">{skill.duration || 'Flexible'}</p>
            </div>
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl space-y-1">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-accent)]">
                <Users size={16} />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Class Size</p>
              <p className="text-base font-serif font-black">{skill.members?.length || 0} / {skill.max_members || 5}</p>
            </div>
            <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl space-y-1">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-primary)] flex items-center justify-center text-[var(--color-accent)]">
                <Calendar size={16} />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Schedule</p>
              <p className="text-base font-serif font-black">{tribeExpertSessions?.length || 0} Slots</p>
            </div>
          </div>

          {/* Schedule Section */}
          <section className="space-y-3">
             <div className="flex items-center gap-3">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)]">{isOwner ? 'Teaching Schedule' : 'Class Schedule'}</h3>
               <div className="h-px flex-1 bg-[var(--color-border)] opacity-30" />
             </div>
             
             <div className="grid grid-cols-1 gap-3">
               {tribeExpertSessions && tribeExpertSessions.length > 0 ? (
                 tribeExpertSessions.map((session: any, idx: number) => {
                   let pillText = session.type === 'MANUAL' ? 'MANUAL' : (isOwner ? 'RECURRING' : 'LIVE SOON');
                   let formattedDate = 'Invalid Date';
                   if (typeof session.displayTime === 'string') {
                       if (session.displayTime.includes('T')) {
                           formattedDate = new Date(session.displayTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                       } else {
                           formattedDate = session.displayTime;
                       }
                   } else if (typeof session.displayTime === 'object' && session.displayTime.day) {
                       formattedDate = `${session.displayTime.day} ${session.displayTime.time || ''}`;
                   }

                   return (
                     <div key={session.id || idx} className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-3xl space-y-4">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="text-[11px] font-black uppercase tracking-widest">{session.displayName}</h4>
                           <p className="text-[9px] opacity-60 mt-1">{formattedDate}</p>
                         </div>
                         <span className="px-3 py-1 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/20 rounded-full text-[8px] font-black uppercase">
                           {pillText}
                         </span>
                       </div>
                       
                       {isParticipant && (
                         <div className="flex gap-3">
                            {renderSessionAction(session)}
                         </div>
                       )}
                     </div>
                   );
                 })
               ) : (
                 <div className="col-span-full p-12 text-center bg-[var(--color-bg-secondary)]/50 border border-dashed border-[var(--color-border)] rounded-[3rem] space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No scheduled slots</p>
                    {isOwner && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full"
                        onClick={handleStartClassroom}
                      >
                        <Video size={14} className="mr-2" /> Start Ad-hoc Session
                      </Button>
                    )}
                 </div>
               )}
             </div>
          </section>

          {/* Members / Collaborative Intelligence */}
          <section className="space-y-3">
             <div className="flex items-center justify-between">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)]">The Cohort</h3>
               <Badge variant="outline" className="text-[8px]">{skill.members?.length || 0} Students</Badge>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skill.members && skill.members.filter(Boolean).length > 0 ? (
                  skill.members.filter(Boolean).map((member: any) => (
                    <div key={member?.id} className="p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between group hover:border-[var(--color-accent)] transition-all">
                       <div className="flex items-center gap-3">
                          <Avatar src={member?.avatar_url} name={member?.name} size="sm" />
                          <div>
                             <p className="text-xs font-black tracking-tight">{member?.name}</p>
                             <p className="text-[8px] font-bold opacity-40 uppercase">Student</p>
                          </div>
                       </div>
                       {user?.id !== member?.id && (
                         <button 
                           onClick={() => handleStartDirectChat(member?.id)}
                           disabled={isStartingChat === member?.id}
                           className="p-2 text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] rounded-xl transition-all"
                         >
                            <MessageCircle size={16} />
                         </button>
                       )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center opacity-30 italic text-xs">
                     Tribe is currently accepting new minds...
                  </div>
                )}
             </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           {/* Exchange Value Focus Card (Desktop Only) */}
           <div className="hidden lg:block p-8 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-xl relative overflow-hidden group shadow-2xl transition-all hover:-translate-y-1 hover:shadow-[0_1.5rem_4rem_-1rem_rgba(0,0,0,0.3)] cursor-default">
              <div className="absolute top-0 right-0 p-6 opacity-10 -mr-4 -mt-4 transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500">
                 <Sparkles size={80} />
              </div>
              <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Exchange Value</p>
                 <div className="flex items-baseline justify-center gap-1.5 text-[var(--color-bg-primary)]">
                    <span className="text-6xl font-serif font-black leading-none tracking-tighter drop-shadow-md">{skill.session_fee === 0 ? 'FREE' : (skill.session_fee || 20)}</span>
                    {skill.session_fee !== 0 && <span className="text-sm font-black uppercase tracking-widest opacity-90">Creds</span>}
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Per Session</p>
              </div>
           </div>

           {/* AI Insight */}
           <AIMatchInsight 
             type="skill"
             itemId={skill.id}
             itemTitle={skill.name}
             itemDescription={skill.description}
           />

           {/* Expert Profile Card */}
           <div className="p-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4">
                 <Sparkles size={100} className="text-[var(--color-accent)]" />
              </div>
              
              <div className="space-y-6 relative z-10">
                 <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)]">Tribe Leader</h4>
                 
                 <div className="flex items-center gap-4">
                    <Avatar 
                      src={skill.user?.avatar_url} 
                      name={skill.user?.name} 
                      size="lg"
                    />
                    <div>
                       <h3 className="text-2xl font-serif font-black leading-tight">{skill.user?.name}</h3>
                       <Badge variant="outline" className="mt-1">Level {skill.user?.level || 1} Expert</Badge>
                    </div>
                 </div>

                 <p className="text-[11px] leading-relaxed opacity-70 italic">
                    Expertise in {skill.category} and surrounding disciplines. Join this tribe to accelerate your growth.
                 </p>

                 {user?.id !== skill.user_id && (
                   <Button 
                     variant="outline" 
                     className="w-full rounded-2xl py-4"
                     onClick={() => handleStartDirectChat(skill.user_id)}
                     loading={isStartingChat === skill.user_id}
                   >
                      <MessageCircle size={14} className="mr-2" /> Contact Expert
                   </Button>
                 )}
              </div>
           </div>

           {/* Notice Board */}
           <AnimatePresence>
             {(skill.notices?.length > 0 || isOwner) && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="p-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] space-y-6"
               >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-xl flex items-center justify-center">
                        <Megaphone size={20} />
                     </div>
                     <div>
                        <h3 className="text-lg font-serif font-black italic">Notice Board</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                           <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Live Updates</span>
                        </div>
                     </div>
                   </div>
                   {isOwner && (
                     <button 
                       onClick={() => setShowNoticeForm(!showNoticeForm)}
                       className="p-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-accent-soft)] transition-all"
                     >
                       {showNoticeForm ? <X size={16} /> : <Plus size={16} />}
                     </button>
                   )}
                 </div>

                 {showNoticeForm && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="p-5 bg-[var(--color-bg-primary)] border border-[var(--color-accent)]/30 rounded-2xl space-y-4"
                   >
                     <textarea 
                       value={newNotice}
                       onChange={(e) => setNewNotice(e.target.value)}
                       placeholder="Broadcast a message..."
                       className="w-full bg-transparent border-none outline-none text-xs font-medium resize-none min-h-[80px]"
                     />
                     <div className="flex justify-end">
                        <Button 
                          variant="accent" 
                          size="sm"
                          className="rounded-xl px-4 py-2 text-[9px]"
                          onClick={handlePostNotice}
                          loading={isPostingNotice}
                        >
                           <Send size={12} className="mr-2" /> Broadcast
                        </Button>
                     </div>
                   </motion.div>
                 )}

                 <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {skill.notices?.filter(Boolean).length === 0 ? (
                       <p className="text-[10px] text-center opacity-30 italic py-8 border border-dashed border-[var(--color-border)] rounded-2xl">No recent announcements</p>
                    ) : (
                       skill.notices?.filter(Boolean).map((notice: any) => (
                         <div key={notice.id} className="p-5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl space-y-3 relative group">
                            <div className="flex justify-between items-start">
                               <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{new Date(notice.created_at).toLocaleDateString()}</p>
                               {isOwner && (
                                 <button 
                                   onClick={() => setNoticeToDelete(notice.id)}
                                   disabled={isDeletingNotice === notice.id}
                                   className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all"
                                 >
                                   <Trash2 size={12} />
                                 </button>
                               )}
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed italic opacity-80">"{notice.content}"</p>
                            <div className="flex items-center gap-2 pt-1">
                               <Avatar src={notice.author?.avatar_url} name={notice.author?.name} size="xs" />
                               <span className="text-[8px] font-black uppercase opacity-60">From {notice.author?.name}</span>
                            </div>
                         </div>
                       ))
                    )}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

            {/* Expert Admin Panel */}
            {isOwner && (
               <div className="p-8 bg-[var(--color-bg-secondary)] border border-[var(--color-accent)]/30 rounded-[2.5rem] shadow-xl space-y-8">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[var(--color-accent)] text-black rounded-xl flex items-center justify-center">
                        <ShieldCheck size={20} />
                     </div>
                     <h3 className="text-xl font-serif font-black italic">Expert Dashboard</h3>
                  </div>

                  {/* Admission Requests */}
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] flex items-center gap-2">
                        <Users size={14} /> Pending Admissions
                     </h4>
                     <div className="space-y-3">
                        {incomingRequests.filter(r => r.status === 'PENDING').length === 0 ? (
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-30 py-6 text-center border border-dashed border-[var(--color-border)] rounded-2xl">No pending requests</p>
                        ) : (
                           incomingRequests.filter(r => r.status === 'PENDING').map(req => (
                              <div key={req.id} className="p-5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl space-y-4">
                                 <div className="flex items-center gap-3">
                                    <Avatar src={req.requester?.avatar_url} name={req.requester?.name} size="xs" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">{req.requester?.name}</p>
                                 </div>
                                 {req.message && <p className="text-[9px] italic opacity-70 leading-relaxed bg-[var(--color-bg-secondary)] p-3 rounded-xl border border-[var(--color-border)]">"{req.message}"</p>}
                                 <div className="grid grid-cols-2 gap-2">
                                    <button 
                                       onClick={() => handleExchangeStatus(req.id, 'ACCEPTED')}
                                       disabled={!!processingId}
                                       className="py-2.5 bg-[var(--color-accent)] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                       {processingId === req.id ? '...' : 'Accept'}
                                    </button>
                                    <button 
                                       onClick={() => handleExchangeStatus(req.id, 'REJECTED')}
                                       disabled={!!processingId}
                                       className="py-2.5 border border-red-500/30 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                       Decline
                                    </button>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>


               </div>
            )}

           {/* Enrollment Status / CTA */}
           <div className="p-8 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] rounded-[2.5rem] shadow-2xl">
              <div className="space-y-6">
                 <div className="flex justify-between items-start">
                    <div>
                       <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Admission Status</h4>
                       <p className="text-xl font-serif font-black mt-1">
                          {isOwner ? 'Leader' : isMember ? 'Enrolled' : 'Open'}
                       </p>
                    </div>
                    <div className="p-3 bg-[var(--color-accent)] text-black rounded-2xl">
                       <CheckCircle2 size={20} />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span>Occupancy</span>
                       <span>{Math.round(((skill.members?.length || 0) / (skill.max_members || 5)) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${((skill.members?.length || 0) / (skill.max_members || 5)) * 100}%` }}
                         className="h-full bg-[var(--color-accent)]"
                       />
                    </div>
                 </div>

                 {isParticipant ? (
                    <div className="pt-4 space-y-4">
                       <p className="text-[10px] opacity-60 font-medium leading-relaxed italic">
                          You are part of this high-performance learning node. Interaction and collaboration are now unlocked.
                       </p>
                    </div>
                 ) : (
                    <div className="pt-4 space-y-6">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                             <CheckCircle2 size={12} className="text-[var(--color-accent)]" />
                             Persistent Group Chat
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                             <CheckCircle2 size={12} className="text-[var(--color-accent)]" />
                             Live Video Sessions
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                             <CheckCircle2 size={12} className="text-[var(--color-accent)]" />
                             Collaborative Learning
                          </div>
                       </div>
                       <Button 
                         variant="accent" 
                         className="w-full rounded-2xl py-5 shadow-lg shadow-[var(--color-accent)]/20"
                         onClick={() => setSelectedSkillForRequest(skill)}
                       >
                          Request to Join
                       </Button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      <SkillExchangeModal 
        isOpen={!!selectedSkillForRequest}
        onClose={() => setSelectedSkillForRequest(null)}
        onSuccess={() => {
          setSelectedSkillForRequest(null)
          notify.success('Request sent! Expert will review your profile.')
        }}
        skill={selectedSkillForRequest}
      />



      {manageGroupSession && isMounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setManageGroupSession(null)} />
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 w-full max-w-2xl relative z-10 shadow-2xl max-h-[80vh] overflow-y-auto">
            <button onClick={() => setManageGroupSession(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-serif font-black mb-2">Manage Session</h2>
            <p className="text-xs opacity-60 mb-6 font-bold tracking-widest uppercase">{new Date(manageGroupSession.isoTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
            
            <div className="space-y-4">
               {skill?.members?.map((member: any) => {
                  const targetTime = new Date(manageGroupSession.isoTime).getTime();
                  const materialized = expertSessions.find(s => 
                    s.exchange?.skill_id === skill.id && 
                    String(s.sender_id) === String(member.id) &&
                    Math.abs(new Date(s.scheduled_time).getTime() - targetTime) < 60000
                  );
                  
                  const isSessionExpired = new Date(manageGroupSession.isoTime).getTime() < (new Date().getTime() - 7200000);
                  let memberSession;
                  if (materialized) {
                    memberSession = {
                       ...materialized,
                       id: materialized.id,
                       displayName: member.name,
                       displayTime: manageGroupSession.isoTime,
                       type: 'SCHEDULED',
                       status: materialized.status,
                       isExpired: isSessionExpired
                    };
                  } else {
                    memberSession = {
                      id: `teach-slot-${skill.id}-${manageGroupSession.slotIdx}-${member.id}`,
                      exchangeId: member.exchange_id,
                      displayName: member.name,
                      displayTime: manageGroupSession.isoTime,
                      type: 'SCHEDULED',
                      status: 'UPCOMING',
                      isExpired: isSessionExpired
                    };
                  }

                  return (
                    <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl gap-4">
                       <div className="flex items-center gap-3">
                          <Avatar src={member.avatar_url} name={member.name} size="sm" />
                          <span className="text-xs font-bold tracking-tight">{member.name}</span>
                       </div>
                       <div className="w-full sm:w-56 flex">
                          {renderSessionAction(memberSession, true)}
                       </div>
                    </div>
                  )
               })}
               
               {(!skill?.members || skill.members.length === 0) && (
                 <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-2xl opacity-50">
                    <p className="text-xs font-bold uppercase tracking-widest">No students joined yet</p>
                 </div>
               )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <AddSkillModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false)
          fetchSkillDetail()
        }}
        skill={skill}
      />

      <ConfirmationModal 
        isOpen={!!noticeToDelete}
        onClose={() => setNoticeToDelete(null)}
        onConfirm={handleDeleteNotice}
        title="Delete Notice?"
        message="Are you sure you want to remove this announcement from the tribe archive? This action cannot be undone."
        confirmText="Delete Archive"
        cancelText="Keep Notice"
        mode="danger"
        loading={!!isDeletingNotice}
      />

      {reviewTarget && isMounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setReviewTarget(null)} />
          <div className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-serif font-black">Session Feedback</h3>
              <button onClick={() => setReviewTarget(null)}><X size={16} /></button>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewForm((p) => ({ ...p, rating: star }))} className="p-1">
                  <Star size={24} className={star <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                </button>
              ))}
            </div>
            <textarea 
              rows={4} 
              placeholder="How was the session? Your feedback helps the community." 
              value={reviewForm.comment} 
              onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} 
              className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm resize-none outline-none focus:border-[var(--color-accent)] transition-colors" 
            />
            <Button 
              onClick={handleSubmitReview} 
              loading={submittingReview}
              className="w-full py-4 text-[10px] font-black uppercase tracking-widest"
              variant="accent"
            >
              Post Feedback
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
