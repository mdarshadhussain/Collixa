'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, Filter, ArrowRight, Plus, CalendarClock, CheckCircle2, X, Link2, Edit2, Trash2, Loader2, Users, Layers, Sparkles, BookOpen, Clock, MessageCircle, Video, Calendar } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import CustomDateTimePicker from '@/components/CustomDateTimePicker'
import Card from '@/components/Card'
import Avatar from '@/components/Avatar'
import { skillService, sessionService, reviewService, conversationService } from '@/lib/supabase'
import AddSkillModal from '@/components/AddSkillModal'
import SkillExchangeModal from '@/components/SkillExchangeModal'
import Typewriter from '@/components/Typewriter'
import { useAuth } from '@/app/context/AuthContext'
import ConfirmationModal from '@/components/ConfirmationModal'
import { notify } from '@/lib/utils'

export default function SkillsPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'rating' | 'newest'>('newest')
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null)
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as 'tribes' | 'academy' | 'enrollments' || 'tribes'
  const [activeTab, setActiveTab] = useState<'tribes' | 'academy' | 'enrollments'>(initialTab)
  const [exchanges, setExchanges] = useState<any[]>([])
  const [loadingExchanges, setLoadingExchanges] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<any | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ scheduledTime: '', meetingLink: '' })
  const [submittingSchedule, setSubmittingSchedule] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<any | null>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewedSessionIds, setReviewedSessionIds] = useState<string[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [editingSkill, setEditingSkill] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, skillId: string}>({
    isOpen: false,
    skillId: ''
  })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const CATEGORIES = ['All', 'Development', 'Design', 'Marketing', 'Data Science', 'Writing', 'Business', 'Other']

  const fetchSkills = useCallback(async () => {
    if (skills.length === 0) setLoading(true)
    try {
      const res = await skillService.getSkills(searchQuery, activeCategory, sortBy)
      if (res.success) {
        setSkills(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeCategory, sortBy, skills.length])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSkills()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchSkills])

  const fetchMyExchanges = useCallback(async () => {
    if (exchanges.length === 0) setLoadingExchanges(true)
    try {
      const res = await skillService.getMyExchanges()
      if (res.success) {
        setExchanges(res.data || [])
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to load exchange requests' })
      }
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', text: 'Failed to load exchange requests' })
    } finally {
      setLoadingExchanges(false)
    }
  }, [exchanges.length])

  useEffect(() => {
    fetchMyExchanges()
  }, [fetchMyExchanges])

  const fetchSessions = useCallback(async () => {
    if (sessions.length === 0) setLoadingSessions(true)
    try {
      const res = await sessionService.getMySessions()
      if (res.success) {
        setSessions(res.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSessions(false)
    }
  }, [sessions.length])

  const fetchMyReviews = useCallback(async () => {
    if (!user) return
    setLoadingReviews(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/reviews/user/${user.id}`)
      const data = await response.json()
      if (response.ok && data.data) {
        // Find reviews where current user is the reviewer
        const myReviews = data.data.filter((r: any) => r.reviewer_id === user.id)
        setReviewedSessionIds(myReviews.map((r: any) => r.session_id).filter(Boolean))
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }, [user])

  useEffect(() => {
    fetchSessions()
    fetchMyReviews()
  }, [fetchSessions, fetchMyReviews])

  useEffect(() => {
    const poll = setInterval(() => {
      fetchMyExchanges()
      fetchSessions()
      fetchMyReviews()
    }, 8000)
    return () => clearInterval(poll)
  }, [fetchMyExchanges, fetchSessions, fetchMyReviews])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const sortedSkills = useMemo(() => {
    if (!skills) return [];
    
    return [...skills].sort((a, b) => {
      const isAOwner = a.user_id === user?.id;
      const isBOwner = b.user_id === user?.id;
      
      const isAJoined = exchanges.some(e => e.skill_id === a.id && e.status === 'ACCEPTED' && e.requester_id === user?.id);
      const isBJoined = exchanges.some(e => e.skill_id === b.id && e.status === 'ACCEPTED' && e.requester_id === user?.id);

      // Scoring: 0 = New, 1 = Joined, 2 = Owned
      const scoreA = isAOwner ? 2 : (isAJoined ? 1 : 0);
      const scoreB = isBOwner ? 2 : (isBJoined ? 1 : 0);

      if (scoreA !== scoreB) return scoreA - scoreB;
      
      // Secondary sort: newest first within each group
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [skills, user?.id, exchanges]);

  const handleExchangeStatus = async (exchangeId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingId(exchangeId)
    const res = await skillService.updateExchangeStatus(exchangeId, status)
    if (res.success) {
      setFeedback({
        type: 'success',
        text: status === 'ACCEPTED'
          ? 'Request accepted. Requester has been notified.'
          : 'Request rejected. Requester has been notified.'
      })
      fetchMyExchanges()
    } else {
      setFeedback({ type: 'error', text: res.error || 'Could not update request status' })
    }
    setProcessingId(null)
  }

  const handleScheduleSession = async () => {
    if (!scheduleTarget || !scheduleForm.scheduledTime) return
    setSubmittingSchedule(true)
    try {
      // Normalize to ISO string to ensure consistent storage in DB
      const isoDateTime = new Date(scheduleForm.scheduledTime).toISOString()

      const res = await sessionService.scheduleSession({
        requestId: scheduleTarget.id,
        scheduledTime: isoDateTime,
        meetingLink: scheduleForm.meetingLink || undefined,
      })
      if (res.success) {
        setFeedback({ type: 'success', text: 'Session scheduled successfully.' })
        setScheduleTarget(null)
        setScheduleForm({ scheduledTime: '', meetingLink: '' })
        fetchSessions()
        fetchMyExchanges()
      } else {
        setFeedback({ type: 'error', text: res.error || 'Could not schedule session' })
      }
    } catch (err) {
      console.error('Frontend scheduling error:', err)
      setFeedback({ type: 'error', text: 'A network error occurred while scheduling. Please check your connection.' })
    } finally {
      setSubmittingSchedule(false)
    }
  }

  const handleCompleteSession = async (sessionId: string) => {
    setProcessingId(sessionId)
    const res = await sessionService.completeSession(sessionId)
    if (res.success) {
      if (res.data.status === 'COMPLETED') {
        setFeedback({ type: 'success', text: 'Session completed. Credits updated.' })
        setReviewTarget(res.data)
      } else {
        setFeedback({ type: 'success', text: 'Completion confirmed. Waiting for other participant.' })
      }
      fetchSessions()
      refreshUser()
    } else {
      setFeedback({ type: 'error', text: res.error || 'Could not complete session' })
    }
    setProcessingId(null)
  }

  const handleCompleteRecurringSession = async (exchangeId: string, scheduledTime: string) => {
    setProcessingId(exchangeId + scheduledTime)
    try {
      const res = await sessionService.completeRecurringSession(exchangeId, scheduledTime)
      if (res.success) {
        if (res.data.status === 'COMPLETED') {
          setFeedback({ type: 'success', text: 'Session completed. Credits updated.' })
          setReviewTarget(res.data)
        } else {
          setFeedback({ type: 'success', text: 'Completion confirmed. Waiting for other participant.' })
        }
        fetchSessions()
        refreshUser()
      } else {
        setFeedback({ type: 'error', text: res.error || 'Could not complete session' })
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
    const res = await reviewService.submitReview({
      sessionId: reviewTarget.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    })
    if (res.success) {
      setFeedback({ type: 'success', text: 'Feedback submitted successfully.' })
      setReviewedSessionIds((prev) => [...prev, reviewTarget.id])
      setReviewTarget(null)
      setReviewForm({ rating: 5, comment: '' })
    } else {
      setFeedback({ type: 'error', text: res.error || 'Could not submit feedback' })
    }
    setSubmittingReview(false)
  }

  const handleOpenSessionChat = async (session: any) => {
    if (!user) return
    const otherUserId = session.sender_id === user.id ? session.receiver_id : session.sender_id
    try {
      const conversation = await conversationService.getOrCreateDirectConversation(user.id, otherUserId)
      if (conversation) {
        router.push(`/chat?id=${conversation.id}`)
      }
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', text: 'Failed to open chat for this session' })
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    setConfirmModal({ isOpen: true, skillId })
  }

  const confirmDelete = async () => {
    const { skillId } = confirmModal
    setIsDeleting(true)
    try {
      const res = await skillService.deleteSkill(skillId)
      if (res.success) {
        setSkills(prev => prev.filter(s => s.id !== skillId))
        setFeedback({ type: 'success', text: 'Skill deleted successfully.' })
        if (refreshUser) refreshUser()
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to delete skill' })
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Error deleting skill' })
    } finally {
      setIsDeleting(false)
      setConfirmModal({ isOpen: false, skillId: '' })
    }
  }

  const handleEditSkill = (skill: any) => {
    setEditingSkill(skill)
    setIsAddModalOpen(true)
  }

  const renderSessionAction = (session: any) => {
    const isMaterialized = session.id && !session.id.startsWith('recurring');
    const isExpert = session.receiver_id === user?.id;
    const isConfirmedByMe = isExpert ? session.receiver_confirmed : session.sender_confirmed;
    const isConfirmedByOther = isExpert ? session.sender_confirmed : session.receiver_confirmed;
    const isCompleted = session.status === 'COMPLETED';
    const isReviewedByMe = reviewedSessionIds.includes(session.id);
    const isWaitingForFeedback = session.status === 'WAITING_FOR_FEEDBACK';

    if (isCompleted) {
      if (isReviewedByMe) {
        return (
          <div className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
            <CheckCircle2 size={12} /> Done
          </div>
        );
      }
      // If completed but I haven't reviewed, fall through to the feedback button logic
    }

    // FEEDBACK PHASE (Now handles COMPLETED status too)
    if (isWaitingForFeedback || (isConfirmedByMe && isConfirmedByOther) || isCompleted) {
      if (isReviewedByMe) {
        return (
          <div className="flex-1 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-[7px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
            <Clock size={10} className="animate-pulse" /> {isCompleted ? 'Awaiting Partner Feedback' : `Waiting for ${isExpert ? 'Student' : 'Host'} Feedback`}
          </div>
        );
      }
      return (
        <button 
          onClick={() => setReviewTarget(session)}
          className="flex-1 py-3 bg-[var(--color-accent)] text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-transform"
        >
          Leave Feedback
        </button>
      );
    }

    // PENDING/LIVE PHASE
    if (!isConfirmedByMe) {
        // If it's time to join and we have a link
        const now = new Date();
        const sessionDate = new Date(session.displayTime);
        const isExpired = sessionDate.getTime() < (now.getTime() - 7200000); // 2 hours past
        const meetingLink = session.meeting_link || session.exchange?.skill?.meeting_link;

        // Skip Join Meeting if host already confirmed (student must see Mark Done)
        if (!isExpired && meetingLink && !( !isExpert && isConfirmedByOther )) {
            return (
                <a 
                  href={meetingLink} 
                  target="_blank" 
                  className="flex-1 py-3 bg-[var(--color-inverse-bg)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Video size={14} /> {isExpert ? 'Start Meeting' : 'Join Meeting'}
                </a>
            );
        }

        // If host hasn't confirmed yet (for student)
        if (!isExpert && !session.receiver_confirmed) {
            return (
                <div className="flex-1 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-[7px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 opacity-60">
                    <Clock size={10} /> Awaiting Host
                </div>
            );
        }

        return (
            <button 
                onClick={() => isMaterialized ? handleCompleteSession(session.id) : handleCompleteRecurringSession(session.exchangeId, session.displayTime)}
                className="flex-1 py-3 border border-[var(--color-border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/5 transition-colors"
            >
                {processingId === (isMaterialized ? session.id : (session.exchangeId + session.displayTime)) ? '...' : 'Mark Done'}
            </button>
        );
    }

    // WAITING FOR OTHER
    if (isConfirmedByMe && !isConfirmedByOther) {
      return (
        <div className="flex-1 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[7px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
          <Clock size={10} className="animate-pulse" /> Waiting for {isExpert ? 'Student' : 'Host'}
        </div>
      );
    }

    return null;
  };

  const incomingRequests = exchanges.filter((x) => x.provider_id === user?.id)
  const outgoingRequests = exchanges.filter((x) => x.requester_id === user?.id)
  // Filter my tribes (the ones I listed)
  const myListedTribes = skills.filter(s => s.user_id === user?.id)
  // Filter tribes I have joined (accepted outgoing requests)
  const myJoinedTribes = outgoingRequests.filter(req => req.status === 'ACCEPTED').map(req => ({
    ...req.skill,
    exchange_id: req.id
  }))

  // Calculate upcoming sessions including recurring ones from tribe schedules
  const upcomingSessions = useMemo(() => {
    const manualSessions = sessions.filter((s) => {
      // Show if not completed OR if completed but not reviewed by me yet
      return s.status !== 'COMPLETED' || !reviewedSessionIds.includes(s.id)
    }).map(s => ({
      ...s,
      type: 'MANUAL',
      displayTime: s.scheduled_time,
      displayName: s.exchange?.skill?.name || 'Class Session'
    }))

    const recurringSessions: any[] = []
    const now = new Date()
    
    myJoinedTribes.forEach(tribe => {
      if (tribe.schedule && Array.isArray(tribe.schedule)) {
        tribe.schedule.forEach((slot: any, idx: number) => {
          if (typeof slot === 'object' && slot.date && slot.time) {
            const displayTime = `${slot.date}T${slot.time}:00`
            
            const targetTime = new Date(displayTime).getTime()
            const materialized = sessions.find(s => 
              s.exchange_id === tribe.exchange_id && 
              Math.abs(new Date(s.scheduled_time).getTime() - targetTime) < 60000
            );
            
            if (materialized) {
               // If materialized and reviewed, skip
               if (materialized.status === 'COMPLETED' && reviewedSessionIds.includes(materialized.id)) return;
               
               // Use the materialized session's data
               recurringSessions.push({
                 ...materialized,
                 id: materialized.id,
                 displayName: tribe.name,
                 displayTime: displayTime,
                 type: 'DATE_BASED',
                 status: materialized.status
               });
            } else {
               const sessionDate = new Date(displayTime)
               // Only show if it's in the future (or very recent)
               if (sessionDate.getTime() > (now.getTime() - 3600000)) {
                  recurringSessions.push({
                   id: `recurring-${tribe.id}-${idx}`,
                   exchangeId: tribe.exchange_id,
                   displayName: tribe.name,
                   displayTime: displayTime,
                   meeting_link: tribe.meeting_link,
                   type: 'DATE_BASED',
                   status: 'UPCOMING'
                 })
               }
            }
          }
        })
      }
    })

    return [...manualSessions, ...recurringSessions]
      .sort((a, b) => new Date(a.displayTime).getTime() - new Date(b.displayTime).getTime())
      .slice(0, 5) // Show only next 5
  }, [sessions, myJoinedTribes, reviewedSessionIds])

  // Calculate teaching sessions (for tribes I lead)
  const expertSessions = useMemo(() => {
    const manualSessions = sessions.filter((s) => {
      return (s.status !== 'COMPLETED' || !reviewedSessionIds.includes(s.id)) && s.receiver_id === user?.id
    }).map(s => ({
      ...s,
      type: 'MANUAL',
      displayTime: s.scheduled_time,
      displayName: `Teaching: ${s.exchange?.skill?.name || 'Session'}`
    }))

    const recurringSessions: any[] = []
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const now = new Date()
    
    myListedTribes.forEach(tribe => {
      if (tribe.schedule && Array.isArray(tribe.schedule)) {
        tribe.schedule.forEach((slot: any, idx: number) => {
          if (typeof slot === 'object' && slot.date && slot.time) {
            const displayTime = `${slot.date}T${slot.time}:00`
            const sessionDate = new Date(displayTime)
            
            // Only show if it's in the future (or very recent)
            if (sessionDate.getTime() > (now.getTime() - 3600000)) {
               recurringSessions.push({
                id: `recurring-expert-${tribe.id}-${idx}`,
                exchangeId: null, // As expert, we might not have a specific exchange ID for a global slot
                displayName: `Teaching: ${tribe.name}`,
                displayTime: displayTime,
                meeting_link: tribe.meeting_link,
                type: 'DATE_BASED',
                status: 'UPCOMING'
              })
            }
          } else if (typeof slot === 'object' && slot.day && slot.time) {
            // Legacy format fallback
            const targetDayIndex = days.indexOf(slot.day)
            if (targetDayIndex === -1) return
            
            let nextDate = new Date()
            const currentDayIndex = now.getDay()
            let daysUntil = (targetDayIndex - currentDayIndex + 7) % 7
            
            const timeParts = slot.time.split(':')
            const hours = parseInt(timeParts[0], 10)
            const minutes = parseInt(timeParts[1], 10)
            if (isNaN(hours) || isNaN(minutes)) return

            if (daysUntil === 0) {
              const sessionTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
              if (now.getTime() > sessionTime.getTime()) {
                daysUntil = 7
              }
            }
            
            nextDate.setDate(now.getDate() + daysUntil)
            nextDate.setHours(hours, minutes, 0, 0)
            
            recurringSessions.push({
              id: `recurring-expert-${tribe.id}-${slot.day}-${slot.time}`,
              displayName: `Teaching: ${tribe.name}`,
              displayTime: nextDate.toISOString(),
              meeting_link: tribe.meeting_link,
              type: 'RECURRING',
              status: 'UPCOMING'
            })
          }
        })
      }
    })

    return [...manualSessions, ...recurringSessions]
      .sort((a, b) => new Date(a.displayTime).getTime() - new Date(b.displayTime).getTime())
      .slice(0, 5)
  }, [sessions, myListedTribes, user?.id, reviewedSessionIds])

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED')

  return (
    <div className="space-y-6 md:space-y-12 mt-0">
      {feedback && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[400] border rounded-2xl px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-2xl flex items-center gap-4 border-white/10 ${
          feedback.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/30'
            : 'bg-red-950/90 text-red-400 border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${feedback.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {feedback.text}
          <button onClick={() => setFeedback(null)} className="ml-4 opacity-40 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Editorial Header */}
      <div className="flex flex-col gap-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl shadow-[var(--color-accent)]/5 group overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
           <Star size={140} className="text-[var(--color-accent)]" fill="currentColor" />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="space-y-2">
             <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] opacity-70">Collective Intelligence</span>
             <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-black tracking-tighter leading-none text-[var(--color-text-primary)]">
               <Typewriter text="Tribes." speed={0.06} delay={0.2} />
             </h1>
             <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)] opacity-40">Build your network. Share your mastery.</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center bg-[var(--color-bg-primary)] p-1.5 rounded-3xl md:rounded-full border border-[var(--color-border)] shadow-inner gap-1">
            {(['tribes', 'academy', 'enrollments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                  activeTab === tab 
                  ? 'bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] shadow-lg' 
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {tab === 'tribes' ? 'The Network' : tab === 'academy' ? 'My Academy' : 'My Enrollments'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'tribes' && (
          <div className="flex flex-col md:flex-row items-center gap-4 relative z-10 w-full pt-2">
            <div className="relative w-full md:flex-1 group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors opacity-40" size={18} />
               <input
                 type="text"
                 placeholder="Search expertise (e.g. React, UX Strategy)..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-16 pr-14 py-5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-[var(--color-accent)] transition-all shadow-inner"
               />
            </div>
            
            <button 
              onClick={() => {
                setEditingSkill(null);
                setIsAddModalOpen(true);
              }}
              className="w-full md:w-auto px-10 py-5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-[var(--color-inverse-bg)] shadow-xl shadow-[var(--color-accent)]/20 rounded-2xl group/btn"
            >
              List Expertise <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {activeTab === 'tribes' && (
        <div className="space-y-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border ${
                  activeCategory === cat 
                  ? 'bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] border-[var(--color-inverse-bg)] shadow-lg' 
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] opacity-60 border-[var(--color-border)] hover:opacity-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-[300px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] animate-pulse" />
              ))
            ) : skills.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-[var(--color-bg-secondary)]/30 rounded-[3rem] border border-dashed border-[var(--color-border)]">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No Tribes found matching your criteria</p>
              </div>
            ) : sortedSkills.map((skill) => (
              <Card key={skill.id} className={`group relative overflow-hidden flex flex-col p-4 sm:p-6 bg-[var(--color-bg-secondary)] rounded-[2.5rem] border transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--color-accent)]/10 cursor-pointer ${skill.status === 'pending' ? 'border-dashed border-amber-500/40' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'}`} onClick={() => router.push(`/skills/${skill.id}`)}>
                {/* Pending Approval Banner */}
                {skill.status === 'pending' && (
                  <div className="flex items-center gap-2 px-4 py-2.5 mb-4 -mx-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <Clock size={12} className="text-amber-500 shrink-0 animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-amber-500">Pending Approval</span>
                  </div>
                )}

                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-primary)]/80 backdrop-blur-sm border border-[var(--color-border)] rounded-full shadow-sm z-10">
                  <Star size={8} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[8px] font-black">{skill.avg_rating || '5.0'}</span>
                </div>

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Avatar src={skill.user?.avatar_url} name={skill.user?.name} size="sm" />
                    <div className="pr-12">
                      <h4 className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] truncate max-w-[80px]">{skill.category}</h4>
                      <p className="text-[7px] font-bold opacity-60 truncate max-w-[80px]">{skill.user?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <h3 className="text-base font-serif font-black tracking-tight leading-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 h-[2.5rem]">{skill.name}</h3>
                  <p className="text-[9px] text-[var(--color-text-secondary)] line-clamp-2 italic opacity-80 leading-relaxed min-h-[2rem]">"{skill.description}"</p>
                  
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[7px] font-black uppercase tracking-widest opacity-60">
                    <div className="flex items-center gap-1"><Users size={10} /> {skill.max_members || 5} Spots</div>
                    <div className="flex items-center gap-1"><Layers size={10} /> {skill.level}</div>
                  </div>
                </div>

                <div className="mt-8">
                  {skill.status === 'pending' ? (
                    <div className="w-full py-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3">
                      <Clock size={14} /> Awaiting Approval
                    </div>
                  ) : (
                    (() => {
                      const isOwner = skill.user_id === user?.id;
                      const isJoined = myJoinedTribes.some(t => t.id === skill.id);

                      if (isOwner) {
                        return (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/skills/${skill.id}`); }}
                            className="w-full py-3.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                            Created <CheckCircle2 size={12} />
                          </button>
                        );
                      }

                      if (isJoined) {
                        return (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/skills/${skill.id}`); }}
                            className="w-full py-3.5 bg-pink-500 text-white text-[8px] font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                          >
                            Joined <ArrowRight size={12} />
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedSkill(skill); }}
                          className="w-full py-3.5 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] text-[8px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all group-hover:bg-[var(--color-accent)] group-hover:text-black flex items-center justify-center gap-2 shadow-lg"
                        >
                          Request Entry <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      );
                    })()
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'academy' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-serif font-black italic tracking-tight text-[var(--color-accent)] flex items-center gap-3">
                <Layers size={20} /> My Listed Tribes
              </h2>
              {myListedTribes.length === 0 ? (
                <div className="p-12 text-center bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)] rounded-[2.5rem]">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">You haven't listed any expertise yet</p>
                   <button onClick={() => setIsAddModalOpen(true)} className="px-8 py-4 bg-[var(--color-accent)] text-black rounded-full text-[9px] font-black uppercase tracking-widest">List Expertise</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  {myListedTribes.map(skill => (
                    <div key={skill.id} className="p-4 sm:p-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] relative group cursor-pointer hover:border-[var(--color-accent)] transition-all" onClick={() => router.push(`/skills/${skill.id}`)}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="px-3 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[8px] font-black uppercase">
                          {skill.category}
                        </div>
                        <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); handleEditSkill(skill); }} className="p-2 hover:text-[var(--color-accent)] transition-colors"><Edit2 size={16} /></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteSkill(skill.id); }} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-serif font-black mb-3">{skill.name}</h3>
                      <div className="flex items-center justify-between text-[9px] font-black uppercase opacity-60 mb-6">
                         <span>{skill.max_members || 5} Members Limit</span>
                         <span className="text-[var(--color-accent)]">
                           {new Set(incomingRequests.filter(r => r.skill_id === skill.id && r.status === 'ACCEPTED').map(r => r.requester_id || r.requester?.id)).size} Joined
                         </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/chat?id=${skill.conversation_id || ''}`);
                          }}
                          className="w-full py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--color-accent-soft)] transition-all shadow-sm"
                        >
                           <MessageCircle size={14} /> Group Chat
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/skills/${skill.id}`);
                          }}
                          className="w-full py-3.5 bg-[var(--color-inverse-bg)] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] hover:text-black transition-all shadow-lg"
                        >
                           View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-8">
               <h2 className="text-xl font-serif font-black italic tracking-tight text-[var(--color-accent)] flex items-center gap-3">
                 <CalendarClock size={20} /> Teaching Schedule
               </h2>
               <div className="space-y-4">
                 {expertSessions.length === 0 ? (
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 py-10 text-center border border-[var(--color-border)] rounded-[2.5rem]">No upcoming teaching slots</p>
                 ) : (
                   expertSessions.map(session => (
                     <div key={session.id} className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-3xl space-y-4 hover:border-[var(--color-accent)]/50 transition-all shadow-sm">
                       <div className="flex justify-between items-start">
                         <div>
                           <h4 className="text-[11px] font-black uppercase tracking-widest">{session.displayName}</h4>
                           <p className="text-[9px] opacity-60 mt-1.5">{isMounted ? new Date(session.displayTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Loading time...'}</p>
                         </div>
                         <span className="px-3 py-1 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/20 rounded-full text-[8px] font-black uppercase">
                            {session.type.includes('RECURRING') ? 'RECURRING' : 'MANUAL'}
                         </span>
                       </div>
                       <div className="flex gap-3 pt-2">
                          {renderSessionAction(session)}
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'enrollments' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                 <h2 className="text-xl font-serif font-black italic tracking-tight text-[var(--color-accent)] flex items-center gap-3">
                    <Plus size={20} /> My Enrolled Tribes
                 </h2>
                 {myJoinedTribes.length === 0 ? (
                   <div className="p-20 text-center bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)] rounded-[3rem]">
                      <Users size={48} className="mx-auto mb-6 opacity-20" />
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-40">You haven't joined any Tribes yet</p>
                      <button onClick={() => setActiveTab('tribes')} className="mt-8 px-10 py-5 bg-[var(--color-inverse-bg)] text-white rounded-full text-[10px] font-black uppercase tracking-widest">Explore The Network</button>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {myJoinedTribes.map(skill => (
                        <div key={skill.id} className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-3xl space-y-6 hover:border-[var(--color-accent)] hover:shadow-[0_1rem_3rem_-1rem_rgba(var(--color-accent-rgb),0.2)] transition-all group relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-150 duration-700" />
                           <div className="flex items-center gap-4 relative z-10">
                              <div className="ring-2 ring-[var(--color-bg-primary)] ring-offset-2 ring-offset-[var(--color-bg-secondary)] rounded-full shrink-0">
                                <Avatar src={skill.user?.avatar_url} name={skill.user?.name} size="md" />
                              </div>
                              <div className="min-w-0">
                                 <h3 className="text-xl font-serif font-black truncate">{skill.name}</h3>
                                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1 truncate">Expert: <span className="text-[var(--color-accent)]">{skill.user?.name}</span></p>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 relative z-10">
                              <button 
                                onClick={() => window.location.href = `/chat?id=${skill.conversation_id || ''}`}
                                className="py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--color-accent-soft)] transition-colors shadow-sm"
                              >
                                 <MessageCircle size={14} /> Group Chat
                              </button>
                              <a 
                                href={skill.meeting_link || '#'} 
                                target="_blank" 
                                className="py-3.5 bg-[var(--color-accent)] text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[var(--color-accent)]/30 transition-all hover:-translate-y-0.5"
                              >
                                 <Video size={14} /> Join Meeting
                              </a>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              <div className="space-y-8">
                 <h2 className="text-xl font-serif font-black italic tracking-tight text-[var(--color-accent)] flex items-center gap-3">
                    <CalendarClock size={20} /> Class Schedule
                 </h2>
                 <div className="space-y-4">
                    {upcomingSessions.length === 0 ? (
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40 py-12 text-center border border-[var(--color-border)] rounded-[2.5rem]">No upcoming sessions</p>
                    ) : (
                      upcomingSessions.map(session => (
                        <div key={session.id} className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl space-y-4 hover:border-[var(--color-accent)]/50 hover:shadow-lg transition-all group">
                           <div className="flex justify-between items-start">
                              <div>
                                 <h4 className="text-[11px] font-black uppercase tracking-widest group-hover:text-[var(--color-accent)] transition-colors">{session.displayName}</h4>
                                 <p className="text-[9px] font-bold opacity-50 mt-1.5 flex items-center gap-1.5">
                                   <Calendar size={10} /> 
                                   {isMounted ? new Date(session.displayTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Loading schedule...'}
                                 </p>
                              </div>
                              <span className="px-3 py-1 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/20 rounded-full text-[8px] font-black uppercase shrink-0">
                                {session.type === 'RECURRING' ? 'RECURRING' : 'LIVE SOON'}
                              </span>
                           </div>
                           <div className="flex gap-3 pt-2">
                              {renderSessionAction(session)}
                           </div>
                        </div>
                      ))

                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      <AddSkillModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingSkill(null)
        }} 
        onSuccess={fetchSkills}
        skill={editingSkill}
      />

      <SkillExchangeModal 
        isOpen={!!selectedSkill} 
        onClose={() => setSelectedSkill(null)} 
        onSuccess={(message) => {
          setFeedback({ type: 'success', text: message })
          fetchMyExchanges()
          setActiveTab('enrollments')
        }}
        skill={selectedSkill}
      />

      {scheduleTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setScheduleTarget(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-black italic tracking-tight">Schedule Session</h3>
              <button onClick={() => setScheduleTarget(null)}><X size={18} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Proposed Date & Time</label>
                <CustomDateTimePicker value={scheduleForm.scheduledTime} onChange={(val) => setScheduleForm((p) => ({ ...p, scheduledTime: val }))} minDate={new Date().toISOString()} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Meeting Link</label>
                <input type="url" placeholder="Zoom/Google Meet/Jitsi" value={scheduleForm.meetingLink} onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))} className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-xs" />
              </div>
            </div>
            <button onClick={handleScheduleSession} disabled={submittingSchedule} className="w-full py-4 rounded-full bg-[var(--color-inverse-bg)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-accent)] transition-all">
              {submittingSchedule ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </motion.div>
        </div>
      )}

      {reviewTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewTarget(null)} />
          <div className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] p-8 space-y-6">
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
            <textarea rows={4} placeholder="How was the session?" value={reviewForm.comment} onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm resize-none outline-none focus:border-[var(--color-accent)] transition-colors" />
            <button onClick={handleSubmitReview} disabled={submittingReview} className="w-full py-4 rounded-2xl bg-[var(--color-inverse-bg)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-accent)] transition-all">
              {submittingReview ? 'Submitting...' : 'Post Feedback'}
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, skillId: '' })} onConfirm={confirmDelete} title="Delete Tribe?" message="Are you sure you want to permanently delete this tribe? This will remove all members and chats." mode="danger" confirmText="Confirm Deletion" loading={isDeleting} />
    </div>
  )
}
