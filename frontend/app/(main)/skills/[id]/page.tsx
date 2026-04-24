'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Edit2
} from 'lucide-react'
import { skillService, conversationService, storageService } from '@/lib/supabase'
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
  const [processingExchangeId, setProcessingExchangeId] = useState<string | null>(null)

  const fetchSkillDetail = useCallback(async () => {
    try {
      setLoading(true)
      const res = await skillService.getSkillDetail(id as string)
      if (res.success) {
        setSkill(res.data)
        // If owner, fetch requests and sessions
        if (user?.id === res.data.user_id) {
          fetchExpertData(res.data.id)
        }
      } else {
        notify.error(res.error || 'Failed to load tribe details')
      }
    } catch (err) {
      console.error(err)
      notify.error('Connection error')
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  const fetchExpertData = async (skillId: string) => {
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
      console.error('Error fetching expert data:', err)
    }
  }

  const handleExchangeStatus = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingExchangeId(requestId)
    try {
      const res = await skillService.updateExchangeStatus(requestId, status)
      if (res.success) {
        notify.success(`Request ${status === 'ACCEPTED' ? 'accepted' : 'declined'}!`)
        fetchExpertData(skill.id)
        fetchSkillDetail()
      } else {
        notify.error(res.error || 'Update failed')
      }
    } catch (err) {
      notify.error('Connection error')
    } finally {
      setProcessingExchangeId(null)
    }
  }

  // Calculate teaching sessions specifically for this tribe
  const tribeExpertSessions = useMemo(() => {
    if (!skill) return []
    const now = new Date();
    
    // Manual sessions
    const manualSessions = expertSessions.filter((s) => s.status !== 'COMPLETED').map(s => ({
      ...s,
      type: 'MANUAL',
      displayTime: s.scheduled_time,
      displayName: skill.user_id === user?.id ? `TEACHING: ${skill.name}` : skill.name
    }))

    // Recurring/Date-based slots from tribe schedule
    const scheduledSlots: any[] = []
    if (skill.schedule && Array.isArray(skill.schedule)) {
      skill.schedule.forEach((slot: any, idx: number) => {
        if (typeof slot === 'object' && slot.date && slot.time) {
          const displayTime = `${slot.date}T${slot.time}:00`;
          const sessionDate = new Date(displayTime);
          
          if (sessionDate.getTime() > (now.getTime() - 3600000)) {
            scheduledSlots.push({
              id: `teach-slot-${skill.id}-${idx}`,
              displayName: skill.user_id === user?.id ? `TEACHING: ${skill.name}` : skill.name,
              displayTime: displayTime,
              type: 'SCHEDULED',
              status: 'UPCOMING'
            })
          }
        } else if (typeof slot === 'object' && slot.day && slot.time) {
            // Include legacy day-based slots since they repeat
            scheduledSlots.push({
              id: `teach-slot-legacy-${skill.id}-${idx}`,
              displayName: skill.user_id === user?.id ? `TEACHING: ${skill.name}` : skill.name,
              displayTime: slot, // Will handle special in UI
              type: 'RECURRING',
              status: 'UPCOMING'
            })
        }
      })
    }

    return [...manualSessions, ...scheduledSlots]
      .sort((a, b) => {
        // Safe sort for objects that might be legacy
        const timeA = typeof a.displayTime === 'string' ? new Date(a.displayTime).getTime() : 0;
        const timeB = typeof b.displayTime === 'string' ? new Date(b.displayTime).getTime() : 0;
        return timeA - timeB;
      })
  }, [skill, expertSessions, user?.id])

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

  const isOwner = user?.id === skill.user_id
  const isMember = skill.members?.some((m: any) => m.id === user?.id)
  const isParticipant = isOwner || isMember

  const handleStartDirectChat = async (targetUserId: string) => {
    if (!user) return
    try {
      setIsStartingChat(targetUserId)
      const conv = await conversationService.getOrCreateDirectConversation(user.id, targetUserId)
      if (conv) {
        router.push(`/chat?id=${conv.id}`)
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
                router.push(`/chat?id=${skill.conversation_id}`)
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
          
          {/* Notice Board */}
          <AnimatePresence>
            {(skill.notices?.length > 0 || isOwner) && (
              <motion.section 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.4em] text-[var(--color-accent)]">Notice Board</h3>
                    <div className="flex h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  </div>
                  {isOwner && (
                    <button 
                      onClick={() => setShowNoticeForm(!showNoticeForm)}
                      className="p-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-accent-soft)] transition-all"
                    >
                      {showNoticeForm ? <X size={16} /> : <Plus size={16} />}
                    </button>
                  )}
                </div>

                {showNoticeForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-[var(--color-bg-secondary)] border border-[var(--color-accent)] rounded-3xl space-y-4"
                  >
                    <textarea 
                      value={newNotice}
                      onChange={(e) => setNewNotice(e.target.value)}
                      placeholder="Broadcast a message to your tribe..."
                      className="w-full bg-transparent border-none outline-none text-xs font-medium resize-none min-h-[100px]"
                    />
                    <div className="flex justify-end">
                       <Button 
                         variant="accent" 
                         size="sm"
                         onClick={handlePostNotice}
                         loading={isPostingNotice}
                       >
                          <Send size={14} className="mr-2" /> Post Announcement
                       </Button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4">
                   {skill.notices?.map((notice: any) => (
                     <div key={notice.id} className="p-6 bg-[var(--color-accent-soft)]/20 border border-[var(--color-accent)]/20 rounded-[2rem] flex gap-4">
                        <div className="p-3 bg-[var(--color-bg-primary)] rounded-2xl h-fit text-[var(--color-accent)]">
                           <Megaphone size={20} />
                        </div>
                         <div className="space-y-2 flex-1">
                           <div className="flex justify-between items-start">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{new Date(notice.created_at).toLocaleDateString()}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="accent" className="text-[8px]">Notice</Badge>
                                {isOwner && (
                                  <button 
                                    onClick={() => setNoticeToDelete(notice.id)}
                                    disabled={isDeletingNotice === notice.id}
                                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                           </div>
                           <p className="text-[13px] font-medium leading-relaxed italic">"{notice.content}"</p>
                           <div className="flex items-center gap-2 pt-2">
                              <Avatar src={notice.author?.avatar_url} name={notice.author?.name} size="xs" />
                              <span className="text-[9px] font-black uppercase opacity-60">From {notice.author?.name}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Hero Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent" className="text-[9px] px-3 py-1">{skill.category}</Badge>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest opacity-60">
                <ShieldCheck size={12} className="text-[var(--color-accent)]" />
                Verified Expertise
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest opacity-60">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                {skill.avg_rating || '5.0'} ({skill.review_count || 0} Reviews)
              </div>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tighter leading-tight">
                {skill.name}
              </h1>
              {isOwner && (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="p-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all shadow-md"
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
              <p className="text-base font-serif font-black">{skill.schedule?.length || 0} Slots</p>
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
                           <button 
                             onClick={handleStartClassroom}
                             className="flex-1 py-3 bg-[var(--color-inverse-bg)] text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center transition-transform hover:scale-[1.02]"
                           >
                             {isOwner ? 'Start Meeting' : 'Join Meeting'}
                           </button>
                           {isOwner && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); notify.success('Session marked as done!'); }}
                               className="flex-1 py-3 border border-[var(--color-border)] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-bg-primary)] transition-colors"
                             >
                               Mark Done
                             </button>
                           )}
                         </div>
                       )}
                     </div>
                   );
                 })
               ) : (
                 <div className="col-span-full p-12 text-center bg-[var(--color-bg-secondary)]/50 border border-dashed border-[var(--color-border)] rounded-[3rem] space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No scheduled slots</p>
                    {isParticipant && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full"
                        onClick={handleStartClassroom}
                      >
                        <Video size={14} className="mr-2" /> {isOwner ? 'Start Ad-hoc Session' : 'Join Classroom'}
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
                {skill.members && skill.members.length > 0 ? (
                  skill.members.map((member: any) => (
                    <div key={member.id} className="p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl flex items-center justify-between group hover:border-[var(--color-accent)] transition-all">
                       <div className="flex items-center gap-3">
                          <Avatar src={member.avatar_url} name={member.name} size="sm" />
                          <div>
                             <p className="text-xs font-black tracking-tight">{member.name}</p>
                             <p className="text-[8px] font-bold opacity-40 uppercase">Student</p>
                          </div>
                       </div>
                       {user?.id !== member.id && (
                         <button 
                           onClick={() => handleStartDirectChat(member.id)}
                           disabled={isStartingChat === member.id}
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
                                       disabled={!!processingExchangeId}
                                       className="py-2.5 bg-[var(--color-accent)] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                                    >
                                       {processingExchangeId === req.id ? '...' : 'Accept'}
                                    </button>
                                    <button 
                                       onClick={() => handleExchangeStatus(req.id, 'REJECTED')}
                                       disabled={!!processingExchangeId}
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
    </div>
  )
}
