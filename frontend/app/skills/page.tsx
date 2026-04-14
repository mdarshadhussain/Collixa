'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Star, Filter, ArrowRight, Plus, CalendarClock, CheckCircle2, X, Link2, Edit2, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomDateTimePicker from '@/components/CustomDateTimePicker'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Card from '@/components/Card'
import Avatar from '@/components/Avatar'
import { skillService, sessionService, reviewService, conversationService } from '@/lib/supabase'
import AddSkillModal from '@/components/AddSkillModal'
import SkillExchangeModal from '@/components/SkillExchangeModal'
import Typewriter from '@/components/Typewriter'
import { useAuth } from '@/app/context/AuthContext'

export default function SkillsPage() {
  const { user, refreshUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState<'rating' | 'newest'>('newest')
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'tribes' | 'requests'>('tribes')
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
  const [editingSkill, setEditingSkill] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    const poll = setInterval(() => {
      fetchMyExchanges()
      fetchSessions()
    }, 8000)
    return () => clearInterval(poll)
  }, [fetchMyExchanges, fetchSessions])

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
        meeting_link: scheduleForm.meetingLink || undefined,
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
        router.push('/chat')
      }
    } catch (err) {
      console.error(err)
      setFeedback({ type: 'error', text: 'Failed to open chat for this session' })
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!window.confirm('Are you sure you want to delete this skill? This cannot be undone.')) return
    setIsDeleting(skillId)
    try {
      const res = await skillService.deleteSkill(skillId)
      if (res.success) {
        setFeedback({ type: 'success', text: 'Skill deleted successfully.' })
        fetchSkills()
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to delete skill' })
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Error deleting skill' })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleEditSkill = (skill: any) => {
    setEditingSkill(skill)
    setIsAddModalOpen(true)
  }

  const incomingRequests = exchanges.filter((x) => x.provider_id === user?.id)
  const outgoingRequests = exchanges.filter((x) => x.requester_id === user?.id)
  const upcomingSessions = sessions.filter((s) => s.status !== 'COMPLETED')
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED')

  const statusBadgeClass = (status: string) => {
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-700 border-green-300'
    if (status === 'SCHEDULED') return 'bg-blue-100 text-blue-700 border-blue-300'
    if (status === 'COMPLETED') return 'bg-gray-100 text-gray-700 border-gray-300'
    return 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)]'
  }

  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen transition-colors duration-700 font-sans">
      <Header />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-3 sm:px-4 md:px-8 py-5 md:py-8 gap-4 md:gap-8">
        
        <Sidebar />

        <main className="flex-1 space-y-6 md:space-y-12 overflow-y-auto">
          {feedback && (
            <div className={`border rounded-xl px-4 py-3 text-[10px] font-semibold ${
              feedback.type === 'success'
                ? 'bg-[var(--color-accent-soft)]/30 border-[var(--color-accent)]/30 text-[var(--color-text-primary)]'
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {feedback.text}
            </div>
          )}

          {/* Editorial Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-8 bg-white border border-[var(--color-border)] rounded-2xl md:rounded-[3rem] p-6 sm:p-8 md:p-12 shadow-xl shadow-[var(--color-accent)]/5">
            <div className="space-y-4">
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] opacity-60">Tribes Directory</span>
               <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black tracking-tighter leading-none text-[var(--color-text-primary)]">
                 <Typewriter text="Tribes." speed={0.06} delay={0.2} />
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-primary)] opacity-40">Discover talented collaborators</p>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsAddModalOpen(true)}
                 className="flex items-center gap-2 sm:gap-4 px-4 sm:px-7 py-3.5 sm:py-4 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.32em] hover:bg-[var(--color-accent)] transition-all shadow-xl group"
               >
                 <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                 List Your expertise
               </button>
            </div>
          </div>

          {/* Search & Intelligence Filters */}
          <div className="flex flex-col gap-5 md:gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
               <div className="lg:col-span-8 group">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors opacity-40" size={18} />
                    <input
                      type="text"
                      placeholder="Search by expertise (e.g. React, UI Design)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="editorial-input !pl-16"
                    />
                  </div>
               </div>
               <div className="lg:col-span-4">
                  <div className="editorial-select-wrapper group">
                    <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-accent)] opacity-40 group-focus-within:opacity-100 transition-opacity z-10" size={16} />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="editorial-select !pl-16"
                    >
                      <option value="newest">Sort: Recently Added</option>
                      <option value="rating">Sort: High Rating</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                    activeCategory === cat 
                      ? 'bg-[var(--color-text-primary)] text-white border-[var(--color-text-primary)] shadow-lg shadow-[var(--color-text-primary)]/10' 
                      : 'bg-white text-[var(--color-text-primary)] opacity-60 border-[var(--color-border)] hover:opacity-100 hover:border-[var(--color-accent-soft)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 border border-[var(--color-border)] bg-[var(--color-bg-secondary)] rounded-xl p-2">
            <button
              onClick={() => setActiveTab('tribes')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.12em] ${
                activeTab === 'tribes'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}
            >
              Tribes
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.12em] ${
                activeTab === 'requests'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                  : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}
            >
              Requests
            </button>
          </div>

          {activeTab === 'requests' ? (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm sm:text-base font-serif font-bold">Skill Exchange Requests</h2>
                <button
                  onClick={fetchMyExchanges}
                  className="text-[9px] uppercase tracking-[0.12em] font-black text-[var(--color-accent)]"
                >
                  Refresh
                </button>
              </div>

              {loadingExchanges ? (
                <p className="text-[10px] text-[var(--color-text-secondary)]">Loading requests...</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Incoming (you can accept/reject/schedule)</p>
                    {incomingRequests.length === 0 ? (
                      <p className="text-[10px] text-[var(--color-text-secondary)]">No pending incoming requests.</p>
                    ) : (
                      incomingRequests.map((req) => (
                        <div key={req.id} className="border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg-primary)]">
                          <p className="text-[10px] font-semibold">{req.requester?.name || 'Requester'} requested <span className="text-[var(--color-accent)]">{req.skill?.name}</span></p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-full border ${statusBadgeClass(req.status)}`}>
                              {req.status}
                            </span>
                            <span className="text-[8px] text-[var(--color-text-secondary)]">Request → Accepted → Scheduled → Completed</span>
                          </div>
                          {req.message && <p className="text-[9px] text-[var(--color-text-secondary)] mt-1 line-clamp-2">"{req.message}"</p>}
                          <div className="flex gap-2 mt-3">
                            {req.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleExchangeStatus(req.id, 'ACCEPTED')}
                                  disabled={processingId === req.id}
                                  className="px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] disabled:opacity-50"
                                >
                                  {processingId === req.id ? 'Working...' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => handleExchangeStatus(req.id, 'REJECTED')}
                                  disabled={processingId === req.id}
                                  className="px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] rounded-lg border border-red-500 text-red-500 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {req.status === 'ACCEPTED' && (
                              <button
                                onClick={() => setScheduleTarget(req)}
                                className="px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] rounded-lg bg-[var(--color-accent)] text-[var(--color-bg-primary)] flex items-center gap-1"
                              >
                                <CalendarClock size={10} /> Schedule Session
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Your request status</p>
                    {outgoingRequests.length === 0 ? (
                      <p className="text-[10px] text-[var(--color-text-secondary)]">No requests sent yet.</p>
                    ) : (
                      outgoingRequests.map((req) => (
                        <div key={req.id} className="border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg-primary)]">
                          <p className="text-[10px] font-semibold">{req.skill?.name}</p>
                          <p className="text-[9px] text-[var(--color-text-secondary)] mt-1">
                            Status: <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${statusBadgeClass(req.status)}`}>{req.status}</span>
                          </p>
                          <p className="text-[8px] text-[var(--color-text-secondary)] mt-1">Request → Accepted → Scheduled → Completed</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-5">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-[190px] sm:h-[240px] md:h-[290px] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg sm:rounded-xl md:rounded-2xl animate-pulse" />
              ))
            ) : skills.map((skill) => (
              <Card key={skill.id} className="group relative overflow-hidden flex flex-col p-0 bg-[var(--color-bg-secondary)] rounded-lg sm:rounded-xl md:rounded-2xl border border-[var(--color-border)] transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--color-accent)]/5 hover:border-[var(--color-accent-soft)] min-h-[190px] sm:min-h-[240px] md:min-h-[290px]">
                {/* Header Visual */}
                <div className="p-2 sm:p-3 md:p-4 flex-1">
                  <div className="flex items-start gap-2 sm:gap-3 mb-2.5 sm:mb-4 md:mb-5">
                    <div className="relative shrink-0">
                      <Avatar name={skill.user?.name || 'User'} src={skill.user?.avatar_url} size="sm" className="ring-1 sm:ring-2 ring-[var(--color-accent-soft)]/20 shadow-sm transition-transform group-hover:scale-105" />
                      <div className="absolute -bottom-1 -right-1 px-1 py-[1px] bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded-full text-[5px] font-semibold uppercase tracking-[0.02em] leading-none shadow-sm">
                        {skill.level}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[11px] sm:text-sm md:text-base font-serif font-black tracking-tight group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 leading-tight">
                        {skill.name}
                      </h3>
                      <p className="text-[6px] sm:text-[8px] md:text-[9px] font-semibold tracking-[0.04em] text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
                        Expertise by {skill.user?.name}
                      </p>
                      <p className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.08em] text-[var(--color-accent)] mt-1 line-clamp-1">
                        {skill.category}
                      </p>
                    </div>
                  </div>

                  {/* Rating & Actions Overlay */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full">
                      <Star size={10} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[9px] font-bold">{skill.avg_rating > 0 ? skill.avg_rating.toFixed(1) : 'New'}</span>
                      {skill.review_count > 0 && <span className="text-[8px] text-[var(--color-text-secondary)]">({skill.review_count})</span>}
                    </div>
                    
                    {user?.id === skill.user_id && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditSkill(skill); }}
                          className="p-1.5 hover:bg-[var(--color-accent-soft)] rounded-md transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSkill(skill.id); }}
                          disabled={isDeleting === skill.id}
                          className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-[var(--color-text-secondary)] hover:text-red-500"
                        >
                          <Trash2 size={12} className={isDeleting === skill.id ? 'animate-pulse' : ''} />
                        </button>
                      </div>
                    )}
                  </div>

                  {skill.description && (
                    <div className="p-1.5 sm:p-2.5 md:p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-md sm:rounded-lg mb-2.5 sm:mb-4 md:mb-5">
                       <p className="text-[7px] sm:text-[8px] md:text-[9px] leading-snug text-[var(--color-text-secondary)] italic line-clamp-2">"{skill.description}"</p>
                    </div>
                  )}

                  {/* Skills tags (If user had multiple, we'd show them, but here it's 1 skill per card) */}
                  <div className="flex items-center gap-1 py-1.5 sm:py-2 md:py-2.5 border-t border-[var(--color-border)] opacity-60">
                     <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.06em] sm:tracking-[0.1em]">Active Since</span>
                     <span className="text-[7px] sm:text-[8px] md:text-[9px] font-bold">{new Date(skill.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Layer */}
                <div className="p-2 sm:p-3 md:p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]/10 group-hover:bg-[var(--color-accent-soft)]/30 transition-colors">
                  <button
                    onClick={() => setSelectedSkill(skill)}
                    className="w-full py-1.5 sm:py-2 md:py-2.5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[6px] sm:text-[7px] md:text-[8px] font-black uppercase tracking-[0.06em] sm:tracking-[0.1em] md:tracking-[0.18em] rounded-md sm:rounded-lg group-hover:bg-[var(--color-accent)] transition-all flex items-center justify-center gap-1 sm:gap-2 group/btn shadow-sm"
                  >
                    Request Exchange
                    <ArrowRight size={9} className="sm:w-[10px] sm:h-[10px] md:w-3 md:h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
          )}

          {activeTab === 'requests' && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6">
              <h3 className="text-sm sm:text-base font-serif font-bold mb-3">Upcoming Sessions</h3>
              {loadingSessions ? (
                <p className="text-[10px] text-[var(--color-text-secondary)]">Loading sessions...</p>
              ) : upcomingSessions.length === 0 ? (
                <p className="text-[10px] text-[var(--color-text-secondary)]">No scheduled sessions yet.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg-primary)]">
                      <p className="text-[10px] font-semibold">{session.exchange?.skill?.name || 'Skill session'}</p>
                      <p className="text-[9px] text-[var(--color-text-secondary)] mt-1">
                        {new Date(session.scheduled_time).toLocaleString()}
                      </p>
                      {session.meeting_link && (
                        <a href={session.meeting_link} target="_blank" rel="noreferrer" className="text-[8px] text-[var(--color-accent)] mt-1 inline-flex items-center gap-1">
                          <Link2 size={10} /> Meeting link
                        </a>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${statusBadgeClass(session.status)}`}>
                          {session.status}
                        </span>
                        
                        {session.status === 'SCHEDULED' && (
                          <>
                            {(() => {
                              const isUserSender = session.sender_id === user?.id;
                              const userConfirmed = isUserSender ? session.sender_confirmed : session.receiver_confirmed;
                              const otherConfirmed = isUserSender ? session.receiver_confirmed : session.sender_confirmed;
                              const isPastScheduled = new Date() > new Date(session.scheduled_time);

                              if (userConfirmed) {
                                return (
                                  <span className="text-[8px] font-black uppercase text-[var(--color-accent)] px-3 py-1.5 bg-[var(--color-accent-soft)]/20 rounded-lg border border-[var(--color-accent)]/20">
                                    {otherConfirmed ? 'Full Completion Pending' : 'Waiting for Peer'}
                                  </span>
                                )
                              }

                              return (
                                <button
                                  onClick={() => handleCompleteSession(session.id)}
                                  disabled={processingId === session.id || !isPastScheduled}
                                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-1 ${
                                    isPastScheduled 
                                      ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-text-primary)]' 
                                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] cursor-not-allowed'
                                  }`}
                                  title={!isPastScheduled ? 'You can only complete after scheduled time' : ''}
                                >
                                  <CheckCircle2 size={10} />
                                  {processingId === session.id ? 'Working...' : 'Mark Completed'}
                                </button>
                              )
                            })()}
                          </>
                        )}
                        <button
                          onClick={() => handleOpenSessionChat(session)}
                          className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[8px] font-black uppercase tracking-[0.1em]"
                        >
                          Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6">
              <h3 className="text-sm sm:text-base font-serif font-bold mb-3">Completed Sessions & Feedback</h3>
              {completedSessions.length === 0 ? (
                <p className="text-[10px] text-[var(--color-text-secondary)]">No completed sessions yet.</p>
              ) : (
                <div className="space-y-2">
                  {completedSessions.map((session) => {
                    const reviewed = reviewedSessionIds.includes(session.id)
                    return (
                      <div key={session.id} className="border border-[var(--color-border)] rounded-xl p-3 bg-[var(--color-bg-primary)]">
                        <p className="text-[10px] font-semibold">{session.exchange?.skill?.name || 'Skill session'}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${statusBadgeClass(session.status)}`}>Completed</span>
                          {reviewed ? (
                            <span className="text-[8px] font-semibold text-[var(--color-accent)]">Feedback Submitted</span>
                          ) : (
                            <button
                              onClick={() => setReviewTarget(session)}
                              className="px-3 py-1.5 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[8px] font-black uppercase tracking-[0.1em]"
                            >
                              Give Feedback
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {!loading && skills.length === 0 && (
            <div className="text-center py-20 md:py-28 border-2 border-dashed border-[var(--color-border)] rounded-2xl md:rounded-[2rem] bg-[var(--color-bg-secondary)]/30">
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
        }}
        skill={selectedSkill}
      />

      {scheduleTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setScheduleTarget(null)} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 space-y-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-soft)]" />
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-1 block">Session Planning</span>
                <h3 className="text-2xl font-serif font-black italic tracking-tight">Schedule Exchange</h3>
              </div>
              <button 
                onClick={() => setScheduleTarget(null)}
                className="w-10 h-10 border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-[var(--color-bg-primary)] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-1">Proposed Date & Time</label>
                <CustomDateTimePicker
                  value={scheduleForm.scheduledTime}
                  onChange={(val) => setScheduleForm((p) => ({ ...p, scheduledTime: val }))}
                  minDate={new Date().toISOString()}
                />
                <p className="text-[8px] text-[var(--color-text-secondary)] italic ml-1">* Credits will be exchanged after session completion</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-1">Virtual Meeting Link</label>
                <div className="relative flex items-center group">
                  <Link2 className="absolute left-4 text-[var(--color-accent)] opacity-60 group-focus-within:opacity-100 transition-opacity" size={16} />
                  <input
                    type="url"
                    placeholder="Zoom, Google Meet, or Teams link"
                    value={scheduleForm.meetingLink}
                    onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-xs font-semibold focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleScheduleSession}
              disabled={submittingSchedule || !scheduleForm.scheduledTime}
              className="w-full py-4 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--color-accent)] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {submittingSchedule ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Finalizing...
                </span>
              ) : (
                'Confirm Schedule'
              )}
            </button>
          </motion.div>
        </div>
      )}

      {reviewTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewTarget(null)} />
          <div className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-bold">Give Feedback</h3>
              <button onClick={() => setReviewTarget(null)}><X size={16} /></button>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setReviewForm((p) => ({ ...p, rating: star }))} className="p-1">
                  <Star size={18} className={star <= reviewForm.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              placeholder="Share your session feedback..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm resize-none"
            />
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="w-full py-2.5 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
