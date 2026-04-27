'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, Plus, MoreVertical, Search, ArrowLeft, MessageCircle, X, Loader2, MapPin, Image as ImageIcon, Camera, Video, Calendar } from 'lucide-react'
import Badge from '@/components/Badge'
import { useAuth } from '@/app/context/AuthContext'
import { conversationService, messageService, supabase, userService, storageService } from '@/lib/supabase'
import Typewriter from '@/components/Typewriter'
import Avatar from '@/components/Avatar'
import ConfirmationModal from '@/components/ConfirmationModal'
import CustomDateTimePicker from '@/components/CustomDateTimePicker'
import { motion, AnimatePresence } from 'framer-motion'

interface UIMessage {
  id: number
  author: string
  avatar: string
  content: string
  timestamp: string
  isOwn: boolean
  type?: 'text' | 'location' | 'system' | 'image' | 'meeting'
  metadata?: any
}

interface UIConversation {
  id: number
  name: string
  avatar: string
  lastMessage: string
  unread: number
  status: 'online' | 'offline'
  chatStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  chatType: 'DIRECT' | 'GROUP'
  isSender?: boolean
  role?: 'ADMIN' | 'MEMBER'
  admin_id?: string
  intent_id?: number | null
}

export default function ChatPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const chatIdFromUrl = searchParams.get('id')
  
  const [conversations, setConversations] = useState<UIConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<UIConversation | null>(null)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mobileShowConversations, setMobileShowConversations] = useState(true)
  
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false)
  const [newChatEmail, setNewChatEmail] = useState('')
  const [searchedUser, setSearchedUser] = useState<any>(null)
  const [isSearchingUser, setIsSearchingUser] = useState(false)
  const [newChatFeedback, setNewChatFeedback] = useState<{type: 'success'|'error', text: string} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'GROUPS' | 'DIRECT'>('GROUPS')
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'INTENT' | 'SKILL'>('ALL')
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false)
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean, 
    title: string, 
    message: string, 
    onConfirm: () => void,
    mode: 'danger' | 'warning'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    mode: 'warning'
  })
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [locationResults, setLocationResults] = useState<any[]>([])
  const [isSearchingLocationSearch, setIsSearchingLocationSearch] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [isFetchingParticipants, setIsFetchingParticipants] = useState(false)
  const [isSendingLocation, setIsSendingLocation] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDateTime, setMeetingDateTime] = useState('')
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false)
  
  const router = useRouter()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch conversations on load
  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      try {
        const rawConvos = await conversationService.getConversations(user.id)
        
        // Fetch roles for each conversation
        const { data: roles } = await supabase
          .from('conversation_participants')
          .select('conversation_id, role')
          .eq('user_id', user.id);

        const roleMap = (roles || []).reduce((acc: any, curr) => {
          acc[curr.conversation_id] = curr.role;
          return acc;
        }, {});
        
        const mapped: UIConversation[] = rawConvos.map(conv => {
          if (conv.type === 'GROUP') {
            return {
              id: conv.id,
              name: conv.title || 'Intent Group',
              avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.title || 'Intent'}`,
              lastMessage: conv.last_message || 'Intent group created.',
              unread: 0,
              status: 'online',
              chatStatus: 'ACCEPTED',
              chatType: 'GROUP',
              role: roleMap[conv.id] || 'MEMBER',
              admin_id: conv.admin_id,
              intent_id: conv.intent_id
            }
          }

          const p1 = (typeof conv.participant_1 === 'object' ? conv.participant_1 : null) as any
          const p2 = (typeof conv.participant_2 === 'object' ? conv.participant_2 : null) as any
          
          const isUserP1 = p1?.id === user.id
          const other = isUserP1 ? p2 : p1
          
          return {
            id: conv.id,
            name: other?.name || 'Unknown User',
            avatar: other?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.name || 'Unknown'}`,
            lastMessage: conv.last_message || 'New Match!',
            unread: 0,
            status: 'online',
            chatStatus: (conv.status as 'PENDING' | 'ACCEPTED' | 'REJECTED') || 'ACCEPTED',
            chatType: 'DIRECT',
            isSender: isUserP1,
            admin_id: conv.admin_id,
            intent_id: conv.intent_id
          }
        })
        
        setConversations(mapped)
        
        setSelectedConversation(currentSelected => {
          if (!currentSelected && mapped.length > 0) {
            if (chatIdFromUrl) {
              const target = mapped.find(c => c.id.toString() === chatIdFromUrl);
              if (target) {
                // Auto-switch tabs
                setActiveTab(target.chatType === 'GROUP' ? 'GROUPS' : 'DIRECT');
                if (target.chatType === 'GROUP') {
                  setGroupFilter(target.intent_id ? 'INTENT' : 'SKILL');
                }
                setMobileShowConversations(false);
                return target;
              }
            }
            
            setMobileShowConversations(true);
            return mapped[0];
          }
          if (currentSelected) {
            return mapped.find(c => c.id === currentSelected.id) || currentSelected
          }
          return currentSelected
        })
      } catch (err) {
        console.error('Failed to load conversations:', err)
      }
    }

    loadConversations()

    // Handle invite from URL if present
    const inviteId = searchParams.get('invite')
    if (inviteId && user) {
      const handleInvite = async () => {
        try {
          const { data: sender } = await supabase.from('users').select('name').eq('id', inviteId).single()
          if (sender && window.confirm(`Accept chat invitation from ${sender.name}?`)) {
            setIsAcceptingInvite(true)
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/chat/accept-invite`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({ senderId: inviteId })
            })
            const data = await res.json()
            if (data.success) {
              loadConversations()
              router.push(`/chat?id=${data.data.id}`)
            }
          }
        } catch (err) {
          console.error('Invite handling failed:', err)
        } finally {
          setIsAcceptingInvite(false)
        }
      }
      handleInvite()
    }

    const convoChannel = supabase.channel(`conversations_usr_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          loadConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(convoChannel)
    }
  }, [user])

  useEffect(() => {
    if (!selectedConversation || !user) return

    const loadMessages = async () => {
      try {
        const rawMessages = await messageService.getMessages(selectedConversation?.id || 0)
        const mapped: UIMessage[] = rawMessages.map(m => {
          const senderId = typeof m.sender_id === 'object' ? (m.sender_id as any)?.id : m.sender_id;
          const isOwn = senderId === user.id
          const sName = typeof m.sender_id === 'object' ? (m.sender_id as any)?.name : 'User';
          const senderName = isOwn ? 'You' : sName;
          
          let type = m.type || 'text';
          if (m.content.startsWith('[SYSTEM]:')) type = 'system';
          let metadata = m.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              console.error('Failed to parse metadata', e);
            }
          }

          return {
            id: m.id,
            content: m.content,
            isOwn: isOwn,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: senderName,
            avatar: isOwn 
              ? (user?.avatar_url ? storageService.getPublicUrl(user.avatar_url) : `https://api.dicebear.com/7.x/avataaars/svg?seed=User`)
              : (typeof m.sender_id === 'object' && (m.sender_id as any)?.avatar_url 
                  ? storageService.getPublicUrl((m.sender_id as any).avatar_url) 
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`),
            type: type,
            metadata: metadata
          }
        })
        setMessages(mapped)
      } catch(err) {
        console.error('Failed to load messages:', err)
      }
    }

    loadMessages()
    
    const markRead = async () => {
      await messageService.markAsRead(selectedConversation.id)
    }
    markRead()
    
    if (selectedConversation?.chatType === 'GROUP') {
      const fetchParts = async () => {
         setIsFetchingParticipants(true)
         try {
           const { data } = await supabase
            .from('conversation_participants')
            .select('role, user_id(id, name, avatar_url, title)')
            .eq('conversation_id', selectedConversation.id)
           setParticipants(data?.map((p: any) => ({ ...p.user_id, role: p.role })) || [])
         } catch (err) {
           console.error(err)
         } finally {
           setIsFetchingParticipants(false)
         }
      }
      fetchParts()
    } else {
      setParticipants([])
    }

    const channel = supabase.channel(`public:messages:conv_${selectedConversation.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}` 
      }, (payload) => {
         const m = payload.new as any
         
         setMessages(prev => {
            if (prev.some(msg => msg.id === m.id)) return prev;

            // Replace optimistic message if it matches
            const optimisticIndex = prev.findIndex(msg => msg.isOwn && msg.content === m.content && msg.id > 1000000000000 && m.sender_id === user.id);
            if (optimisticIndex !== -1) {
              const newMessages = [...prev];
              newMessages[optimisticIndex] = { ...newMessages[optimisticIndex], id: m.id };
              return newMessages;
            }

            return [...prev, {
              id: m.id,
              content: m.content,
              isOwn: m.sender_id === user.id,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              author: m.sender_id === user.id ? 'You' : selectedConversation.name,
              avatar: m.sender_id === user.id 
                ? (user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=User`)
                : selectedConversation.avatar,
              type: m.type || 'text',
              metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata
            }]
         })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation?.id, selectedConversation?.name, selectedConversation?.avatar, selectedConversation?.chatType, user])

  const handleScheduleMeeting = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedConversation || !user || !meetingTitle || !meetingDateTime) return
    
    setIsSchedulingMeeting(true)
    try {
      await messageService.scheduleMeeting(
        selectedConversation.id,
        meetingTitle,
        meetingDateTime
      )
      setShowMeetingModal(false)
      setMeetingTitle('')
      setMeetingDateTime('')
    } catch (err) {
      console.error('Failed to schedule meeting:', err)
    } finally {
      setIsSchedulingMeeting(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    const content = newMessage.trim()
    setNewMessage('')
    
    const tempMsg: UIMessage = {
      id: Date.now(),
      author: 'You',
      avatar: user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=User`,
      content: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
      type: 'text'
    }
    setMessages(prev => [...prev, tempMsg])

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: content }
          : conv
      )
    )

    try {
      if (!selectedConversation) return
      await messageService.sendMessage(selectedConversation.id, user.id, content)
      await conversationService.updateConversation(selectedConversation.id, { last_message: content }) 
    } catch(err) {
      console.error('Message failed:', err)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !selectedConversation) return

    setIsUploadingImage(true)
    setShowPlusMenu(false)
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const path = `chat/${selectedConversation.id}/${fileName}`
      const url = await storageService.uploadFile('attachments', path, file)
      
      if (url) {
        await messageService.sendMessage(
          selectedConversation.id,
          user.id,
          '[Image]',
          'image',
          { url }
        )
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSearchLocation = async () => {
    if (!locationSearchQuery.trim()) return
    setIsSearchingLocationSearch(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationSearchQuery)}&addressdetails=1&limit=20&extratags=1&dedupe=1`)
      const data = await res.json()
      setLocationResults(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setIsSearchingLocationSearch(false)
    }
  }

  const selectLocation = async (lat: string, lon: string, display_name: string) => {
    if (!user || !selectedConversation || isSendingLocation) return
    setIsSendingLocation(true)
    try {
      await messageService.sendMessage(
        selectedConversation.id,
        user.id,
        `📍 ${display_name}`,
        'location',
        { latitude: parseFloat(lat), longitude: parseFloat(lon) }
      )
      setShowLocationSearch(false)
      setLocationSearchQuery('')
      setLocationResults([])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSendingLocation(false)
    }
  }

  const handleSendLocation = () => {
    if (!selectedConversation || !user || isSendingLocation) return
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsSendingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        let address = `📍 Shared a location`
        try {
          // Fetch place name using Nominatim Reverse Geocoding
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
          const data = await res.json()
          if (data && data.display_name) {
             // Extract a shorter version of the address if possible (e.g. road + city)
             const addr = data.address;
             const shortAddress = [addr.road, addr.suburb, addr.city, addr.town, addr.village]
               .filter(Boolean)
               .slice(0, 2)
               .join(', ') || data.display_name;
             
             address = `📍 ${shortAddress}`;
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err)
        }

        try {
          await messageService.sendMessage(
            selectedConversation.id, 
            user.id, 
            address, 
            'location', 
            { latitude, longitude }
          )
          setShowPlusMenu(false)
        } catch (err) {
          console.error('Failed to send location:', err)
        } finally {
          setIsSendingLocation(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Could not get your location. Please check permissions.')
        setIsSendingLocation(false)
      }
    )
  }

  const handleMakeAdmin = async (targetUserId: string) => {
    if (!selectedConversation) return
    const success = await conversationService.updateParticipantRole(selectedConversation.id, targetUserId, 'ADMIN')
    if (success) {
      setParticipants(prev => prev.map(p => p.id === targetUserId ? { ...p, role: 'ADMIN' } : p))
    }
  }

  const handleRemoveAdmin = async (targetUserId: string) => {
    if (!selectedConversation) return
    const success = await conversationService.updateParticipantRole(selectedConversation.id, targetUserId, 'MEMBER')
    if (success) {
      setParticipants(prev => prev.map(p => p.id === targetUserId ? { ...p, role: 'MEMBER' } : p))
    }
  }

  const handleRemoveMember = async (targetUserId: string) => {
    if (!selectedConversation) return
    const success = await conversationService.removeParticipant(selectedConversation.id, targetUserId)
    if (success) {
      setParticipants(prev => prev.filter(p => p.id !== targetUserId))
    }
  }

  const handleSearchUser = async () => {
    if (!newChatEmail.trim() || !user) return
    setIsSearchingUser(true)
    setNewChatFeedback(null)
    setSearchedUser(null)
    try {
      const targetUser = await userService.getUserByEmail(newChatEmail.trim())
      if (!targetUser) {
        setNewChatFeedback({ type: 'error', text: 'No user found with that email.' })
        return
      }
      if (targetUser.id === user.id) {
        setNewChatFeedback({ type: 'error', text: 'You cannot message yourself.' })
        return
      }
      setSearchedUser(targetUser)
    } catch (err) {
      console.error(err)
      setNewChatFeedback({ type: 'error', text: 'Error locating user.' })
    } finally {
      setIsSearchingUser(false)
    }
  }

  const handleSendRequest = async () => {
    if (!searchedUser || !user) return
    setIsSearchingUser(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/chat/invite`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ email: searchedUser.email })
      })
      const data = await res.json()
      if (data.success) {
        setNewChatFeedback({ type: 'success', text: 'Request sent! They will see it in their action center.' })
        // Clear query and user
        setNewChatEmail('')
        setSearchedUser(null)
        
        // Wait for user to read before closing (or let them close manually)
        setTimeout(() => {
          setIsNewChatModalOpen(false)
          setNewChatFeedback(null)
        }, 4000)
      } else {
        setNewChatFeedback({ type: 'error', text: data.error || data.message || 'Failed to send invite.' })
      }
    } catch (err) {
      console.error(err)
      setNewChatFeedback({ type: 'error', text: 'Error starting conversation.' })
    } finally {
      setIsSearchingUser(false)
    }
  }

  const handleClearChat = async () => {
    if (!selectedConversation) return
    setIsChatMenuOpen(false)
    setConfirmModal({
      isOpen: true,
      title: 'Clear Archive?',
      message: 'Warning: Clearing this node will permanently remove all messages on both sending and receiving sides. This cannot be undone.',
      mode: 'danger',
      onConfirm: async () => {
        const success = await conversationService.clearChat(selectedConversation.id)
        if (success) {
          setMessages([])
          setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, lastMessage: '' } : c))
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleStartDirectChat = async (targetUserId: string) => {
    if (!user) return
    setIsSearchingUser(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/chat/conversations/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ userId: targetUserId })
      })
      const data = await res.json()
      if (data.success) {
        setShowMembersModal(false)
        router.push(`/chat?id=${data.data.id}`)
        // The URL change will trigger the useEffect to load the conversation
      }
    } catch (err) {
      console.error('Failed to start direct chat:', err)
    } finally {
      setIsSearchingUser(false)
    }
  }

  const handleRejectRequest = async () => {
    if (!selectedConversation) return
    const success = await conversationService.rejectMessageRequest(selectedConversation.id)
    if (success) {
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id))
      setSelectedConversation(null)
      setMobileShowConversations(true)
      router.push('/chat')
    }
  }

  const handleAcceptRequest = async () => {
    if (!selectedConversation) return
    const success = await conversationService.acceptMessageRequest(selectedConversation.id)
    if (success) {
      setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, chatStatus: 'ACCEPTED' } : c))
      setSelectedConversation(prev => prev ? { ...prev, chatStatus: 'ACCEPTED' } : null)
    }
  }

  const handleRemoveRejectedChat = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selectedConversation || !user) return
    const success = await conversationService.leaveConversation(selectedConversation.id, user.id)
    if (success) {
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id))
      setSelectedConversation(null)
      setMobileShowConversations(true)
      router.push('/chat')
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return
    setIsChatMenuOpen(false)
    const modeText = selectedConversation.chatType === 'GROUP' ? 'leave this intent group' : 'delete this connection'
    
    setConfirmModal({
      isOpen: true,
      title: 'Sever Connection?',
      message: `Are you sure you want to permanently ${modeText}? Your message history will be archived but you will no longer be a participant.`,
      mode: 'warning',
      onConfirm: async () => {
        if (!user) return
        const success = await conversationService.leaveConversation(selectedConversation.id, user.id)
        if (success) {
          setConversations(prev => prev.filter(c => c.id !== selectedConversation.id))
          setSelectedConversation(null)
          setMobileShowConversations(true)
          router.push('/chat')
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const ConversationItem = ({ conv }: { conv: UIConversation }) => (
    <button
      onClick={() => {
        setSelectedConversation(conv)
        setMobileShowConversations(false)
      }}
      className={`w-full text-left p-6 border-b border-[var(--color-border)] hover:bg-[var(--color-accent-soft)]/20 transition-all group relative ${
        selectedConversation?.id === conv.id ? 'bg-[var(--color-accent-soft)]/20 border-l-4 border-l-[var(--color-accent)]' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={conv.name} src={conv.avatar} size="md" className="ring-2 ring-transparent group-hover:ring-[var(--color-accent-soft)] transition-all" />
          {conv.status === 'online' && (
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-4 border-[var(--color-bg-secondary)]"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-black tracking-tight group-hover:text-[var(--color-accent)] transition-colors">{conv.name}</span>
            {conv.unread > 0 && (
              <span className="px-2 py-0.5 min-w-[1.25rem] text-center text-[8px] font-black bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-full">
                {conv.unread}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--color-text-secondary)] truncate font-medium opacity-60 italic">{conv.lastMessage}</p>
        </div>
      </div>
    </button>
  )

  return (
    <>
      <div className="h-[calc(100vh-160px)] flex gap-4 overflow-hidden relative">
            
            <div
              className={`w-full md:w-80 lg:w-96 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm transition-all ${
                mobileShowConversations ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div className="p-6 space-y-6 border-b border-[var(--color-border)]">
                {/* Top Search + Plus Icon */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors opacity-40" size={16} />
                    <input
                      type="text"
                      placeholder="Search node..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={() => setIsNewChatModalOpen(true)} 
                    className="p-3 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-lg active:scale-95"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Tabs for Groups/Direct */}
                <div className="flex p-1 bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-2xl">
                  <button 
                    onClick={() => setActiveTab('GROUPS')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'GROUPS' ? 'bg-[var(--color-accent)] text-white shadow-md' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}
                  >
                    Groups
                  </button>
                  <button 
                    onClick={() => setActiveTab('DIRECT')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'DIRECT' ? 'bg-[var(--color-accent)] text-white shadow-md' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`}
                  >
                    Direct
                  </button>
                </div>

                {/* Optional Group Filter Dropdown */}
                {activeTab === 'GROUPS' && (
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Filter Type</span>
                    <select 
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value as any)}
                      className="bg-transparent text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] outline-none cursor-pointer"
                    >
                      <option value="ALL">All Nodes</option>
                      <option value="INTENT">Intents</option>
                      <option value="SKILL">Tribes</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {(() => {
                  const filtered = conversations.filter(c => {
                    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                         c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
                    if (!matchesSearch) return false;
                    
                    if (activeTab === 'DIRECT') return c.chatType === 'DIRECT';
                    
                    // Group filtering
                    if (c.chatType !== 'GROUP') return false;
                    if (groupFilter === 'ALL') return true;
                    
                    // Intents have an intent_id associated with them
                    if (groupFilter === 'INTENT') return c.intent_id !== null && c.intent_id !== undefined && c.intent_id !== '';
                    
                    // Tribes (Skills) are groups without an intent_id
                    if (groupFilter === 'SKILL') return !c.intent_id;
                    
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-12 text-center">
                        <div className="w-12 h-12 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20">
                          <MessageCircle size={20} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Empty Node Archive.</p>
                      </div>
                    );
                  }

                  return filtered.map(conv => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ));
                })()}
              </div>
            </div>

            <div className={`flex-1 flex flex-col bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-sm ${!mobileShowConversations ? 'flex' : 'hidden md:flex'}`}>
              {selectedConversation ? (
                <>
                  <div className="px-8 py-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 flex-1">
                      <button 
                        onClick={() => setMobileShowConversations(true)} 
                        className="md:hidden p-3 -ml-2 text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/20 rounded-full transition-all"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <Avatar name={selectedConversation.name} src={selectedConversation.avatar} size="lg" />
                      <div className="cursor-pointer group/title" onClick={() => selectedConversation?.chatType === 'GROUP' && setShowMembersModal(true)}>
                        <h3 className="text-lg font-serif font-black tracking-tight flex items-center gap-2 group-hover/title:text-[var(--color-accent)] transition-all">
                          {selectedConversation?.name}
                          {selectedConversation?.role === 'ADMIN' && <Badge variant="blue" className="px-2 py-0.5 text-[7px]">ADMIN</Badge>}
                        </h3>
                        {selectedConversation.chatType === 'GROUP' && <p className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover/title:opacity-100 transition-all">View Members</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4 relative">
                      <button 
                        onClick={() => setIsChatMenuOpen(!isChatMenuOpen)}
                        className="p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {isChatMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[40]" onClick={() => setIsChatMenuOpen(false)}></div>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl shadow-xl z-[50] py-2 overflow-hidden">
                            <button 
                              onClick={handleClearChat}
                              className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[var(--color-accent-soft)]/20 transition-all text-[var(--color-text-primary)]"
                            >
                              Clear Chat
                            </button>
                            <button 
                              onClick={handleDeleteConversation}
                              className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all text-red-500"
                            >
                              {selectedConversation.chatType === 'GROUP' ? 'Leave Group' : 'Delete User'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-[var(--color-bg-primary)]/20 relative">
                    {selectedConversation.chatStatus === 'PENDING' || selectedConversation.chatStatus === 'REJECTED' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-primary)]/80 backdrop-blur-sm z-20">
                         <div className="text-center p-8 bg-[var(--color-bg-secondary)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl max-w-sm w-full mx-4">
                            {selectedConversation.chatStatus === 'REJECTED' ? (
                               <>
                                 <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <X size={24} />
                                 </div>
                                 <h3 className="text-xl font-serif font-black italic mb-2">Request Declined</h3>
                                 <p className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text-secondary)] mb-6">Chat Unavailable</p>
                                 <p className="text-xs text-[var(--color-text-secondary)] mb-6">{selectedConversation.isSender ? `${selectedConversation.name} declined your chat request.` : `You declined the chat request from ${selectedConversation.name}.`}</p>
                                 <button onClick={handleRemoveRejectedChat} className="w-full py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] transition-all">Remove Chat</button>
                               </>
                            ) : selectedConversation.isSender ? (
                              <>
                                <h3 className="text-xl font-serif font-black italic mb-2">Request Sent</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text-secondary)] mb-6">Awaiting Acceptance</p>
                                <p className="text-xs text-[var(--color-text-secondary)] mb-6">You will be able to send messages once {selectedConversation.name} approves your request.</p>
                                <button onClick={handleDeleteConversation} className="w-full py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-red-500 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-red-500/10 transition-all">Cancel Request</button>
                              </>
                            ) : (
                              <>
                                <h3 className="text-xl font-serif font-black italic mb-2">Message Request</h3>
                                <p className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text-secondary)] mb-6">From {selectedConversation.name}</p>
                                <div className="space-y-3">
                                  <button onClick={handleAcceptRequest} className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[var(--color-inverse-bg)] shadow-lg transition-all">Accept Request</button>
                                  <button onClick={handleRejectRequest} className="w-full py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all">Decline</button>
                                </div>
                              </>
                            )}
                         </div>
                      </div>
                    ) : null}

                    {messages.length === 0 && selectedConversation.chatStatus === 'ACCEPTED' ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center p-8 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md rounded-[2.5rem] border border-[var(--color-border)]">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">Begin synchronizing.</span>
                         </div>
                      </div>
                    ) : (
                      messages.map((msg: any) => (
                        msg.type === 'system' ? (
                          <div key={msg.id} className="flex justify-center my-6">
                            <div className="bg-[var(--color-bg-primary)]/40 backdrop-blur-sm px-6 py-2 rounded-2xl border border-[var(--color-border)] shadow-sm">
                              <p className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em] opacity-60">
                                {msg.content.replace('[SYSTEM]:', '').trim()}
                              </p>
                            </div>
                          </div>
                        ) : msg.type === 'location' ? (
                          <div key={msg.id} className={`flex gap-4 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex flex-col ${msg.isOwn ? 'items-end' : ''}`}>
                               {selectedConversation?.chatType === 'GROUP' && !msg.isOwn && (
                                 <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] ml-4 mb-1 opacity-60">
                                   {msg.author}
                                 </span>
                               )}
                              <div className={`max-w-[16rem] md:max-w-md p-0 overflow-hidden rounded-3xl shadow-sm ${msg.isOwn ? 'bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-tr-none' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-tl-none'}`}>
                                <div className="p-4 bg-black/5">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-[var(--color-accent)] text-white rounded-xl">
                                      <MapPin size={16} />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Location Shared</p>
                                      <p className="text-xs font-bold leading-tight mb-0.5">{msg.content.replace('📍 ', '')}</p>
                                      <p className="text-[9px] opacity-40 font-medium">{msg.metadata?.latitude?.toFixed(4)}, {msg.metadata?.longitude?.toFixed(4)}</p>
                                    </div>
                                  </div>
                                  <a 
                                    href={`https://www.google.com/maps?q=${msg.metadata?.latitude},${msg.metadata?.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-3 bg-[var(--color-accent)] text-white text-[10px] font-black uppercase tracking-widest text-center rounded-xl hover:bg-black transition-all"
                                  >
                                    View on Map
                                  </a>
                                </div>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mt-2 opacity-40">{msg.timestamp}</span>
                            </div>
                          </div>
                        ) : msg.type === 'image' ? (
                          <div key={msg.id} className={`flex gap-4 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex flex-col ${msg.isOwn ? 'items-end' : ''}`}>
                              {selectedConversation?.chatType === 'GROUP' && !msg.isOwn && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] ml-4 mb-1 opacity-60">
                                  {msg.author}
                                </span>
                              )}
                              <div className={`max-w-[10rem] md:max-w-[14rem] p-1.5 overflow-hidden rounded-[2rem] shadow-sm ${msg.isOwn ? 'bg-[var(--color-accent)] rounded-tr-none' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-tl-none'}`}>
                                <img 
                                  src={msg.metadata?.url} 
                                  alt="Shared Image" 
                                  className="w-full h-auto rounded-[1.5rem] object-cover min-w-[140px] min-h-[100px]"
                                  loading="lazy"
                                />
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mt-2 opacity-40">{msg.timestamp}</span>
                            </div>
                          </div>
                        ) : msg.type === 'meeting' ? (
                          <div key={msg.id} className={`flex gap-4 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex flex-col ${msg.isOwn ? 'items-end' : ''}`}>
                              {selectedConversation?.chatType === 'GROUP' && !msg.isOwn && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] ml-4 mb-1 opacity-60">
                                  {msg.author}
                                </span>
                              )}
                              <div className={`max-w-[15rem] md:max-w-[18rem] overflow-hidden rounded-[1.5rem] shadow-2xl transition-all hover:scale-[1.01] ${msg.isOwn ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)]'}`}>
                                <div className="p-4">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-xl ${msg.isOwn ? 'bg-white/20' : 'bg-[var(--color-accent-soft)]/30 text-[var(--color-accent)]'}`}>
                                      <Video size={18} />
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className={`text-[7px] font-black tracking-[0.1em] mb-0.5 ${msg.isOwn ? 'text-white/60' : 'opacity-40'}`}>Collab Meeting</p>
                                      <p className="text-[11px] font-black tracking-tight truncate">{msg.metadata?.title}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${msg.isOwn ? 'bg-black/10' : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)]'}`}>
                                      <Calendar size={12} className={msg.isOwn ? 'text-white/40' : 'opacity-30'} />
                                      <p className={`text-[10px] font-bold ${msg.isOwn ? 'text-white/80' : 'opacity-70'}`}>
                                        {msg.metadata?.scheduledAt ? new Date(msg.metadata.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                      </p>
                                    </div>
                                    
                                    <button 
                                      onClick={() => window.open(`https://meet.jit.si/${msg.metadata?.roomName}`, '_blank')}
                                      className={`w-full py-3 text-[10px] font-black tracking-[0.1em] text-center rounded-xl transition-all shadow-lg active:scale-[0.98] ${msg.isOwn ? 'bg-white text-[var(--color-accent)] hover:bg-black hover:text-white' : 'bg-[var(--color-accent)] text-white hover:bg-black'}`}
                                    >
                                      Join meeting
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mt-1.5 opacity-40">{msg.timestamp}</span>
                            </div>
                          </div>
                        ) : (
                          <div key={msg.id} className={`flex gap-4 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex flex-col ${msg.isOwn ? 'items-end' : ''}`}>
                              {selectedConversation?.chatType === 'GROUP' && !msg.isOwn && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] ml-4 mb-1 opacity-60">
                                  {msg.author}
                                </span>
                              )}
                              <div className={`max-w-[16rem] md:max-w-md px-6 py-4 rounded-3xl shadow-sm ${msg.isOwn ? 'bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-tr-none' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-tl-none'}`}>
                                <p className="text-sm font-medium">{msg.content}</p>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mt-2 opacity-40">{msg.timestamp}</span>
                            </div>
                          </div>
                        )
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 pb-24 md:p-6 md:pb-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] relative">
                    <AnimatePresence>
                    {showPlusMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-4 mb-4 w-56 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-3xl shadow-2xl overflow-hidden z-30"
                      >
                        <div className="p-2 space-y-1">
                          <div className="relative w-full group">
                            <button className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-bg-secondary)] rounded-2xl transition-all">
                              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                <ImageIcon size={18} />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-black tracking-tight">Photos</p>
                                <p className="text-[9px] opacity-40">Share images</p>
                              </div>
                            </button>
                            <input 
                              type="file" 
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleFileSelect}
                            />
                          </div>
                          
                          <div className="h-px bg-[var(--color-border)] mx-3 my-1" />

                          <button 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowPlusMenu(false)
                              handleSendLocation()
                            }}
                            disabled={isSendingLocation}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-bg-secondary)] rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="p-2 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-all">
                              {isSendingLocation ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black tracking-tight">{isSendingLocation ? 'Sending...' : 'Current location'}</p>
                              <p className="text-[9px] opacity-40">Share GPS coords</p>
                            </div>
                          </button>

                          <button 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowPlusMenu(false)
                              setShowLocationSearch(true)
                            }}
                            disabled={isSendingLocation}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-bg-secondary)] rounded-2xl transition-all group disabled:opacity-50"
                          >
                            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                              <Search size={18} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black tracking-tight">Search location</p>
                              <p className="text-[9px] opacity-40">Find any place</p>
                            </div>
                          </button>

                          <div className="h-px bg-[var(--color-border)] mx-3 my-1" />

                          <button 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowPlusMenu(false)
                              setShowMeetingModal(true)
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-bg-secondary)] rounded-2xl transition-all group"
                          >
                            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                              <Calendar size={18} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black tracking-tight">Schedule meeting</p>
                              <p className="text-[9px] opacity-40">Set a collab time</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>

                    <div className="flex gap-2.5 md:gap-4 items-center">
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowPlusMenu(!showPlusMenu)
                        }}
                        disabled={isUploadingImage}
                        className={`p-4 ${showPlusMenu ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'} rounded-2xl hover:text-[var(--color-accent)] transition-all flex-shrink-0 disabled:opacity-50`}
                      >
                        {isUploadingImage ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Plus size={20} className={`transition-transform duration-300 ${showPlusMenu ? 'rotate-45' : ''}`} />
                        )}
                      </button>
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 px-6 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm font-medium focus:border-[var(--color-accent)] outline-none transition-all"
                      />
                      <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="p-4 bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-2xl hover:bg-[var(--color-inverse-bg)] disabled:opacity-40 transition-all shadow-lg flex-shrink-0"><Send size={20} /></button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-[2rem] flex items-center justify-center mb-8"><MessageCircle size={40} /></div>
                  <h3 className="text-2xl font-serif italic text-[var(--color-text-primary)]">Select a chat.</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mt-4">Stay connected with your community</p>
                </div>
              )}
            </div>
      </div>

      <AnimatePresence>
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewChatModalOpen(false)} 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-soft)]" />
            
            <div className="flex items-center justify-between z-10 relative">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-1 block">Network Expansion</span>
                <h3 className="text-2xl font-serif font-black italic tracking-tight">New Conversation</h3>
              </div>
              <button 
                onClick={() => setIsNewChatModalOpen(false)}
                className="w-10 h-10 border border-[var(--color-border)] rounded-full flex items-center justify-center hover:bg-[var(--color-bg-primary)] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 z-10 relative">
              {!searchedUser ? (
                <>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-1">User Email Address</span>
                  <div className="relative flex items-center group">
                    <Search className="absolute left-4 text-[var(--color-accent)] opacity-60 group-focus-within:opacity-100 transition-opacity" size={16} />
                    <input
                      type="email"
                      placeholder="e.g. peer@collixa.com"
                      autoFocus
                      value={newChatEmail}
                      onChange={(e) => setNewChatEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                      className="w-full pl-10 pr-4 py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm font-medium focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-primary)] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <Avatar name={searchedUser.name} src={searchedUser.avatar_url} size="md" />
                      <div>
                        <h4 className="font-black text-sm tracking-tight">{searchedUser.name}</h4>
                        <p className="text-[10px] text-[var(--color-text-secondary)]">{searchedUser.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSearchedUser(null)}
                      className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-xl text-[var(--color-accent)] opacity-40 hover:opacity-100 transition-all flex flex-col items-center gap-1"
                    >
                      <ArrowLeft size={14} />
                      <span className="text-[7px] font-black uppercase tracking-widest">Change</span>
                    </button>
                  </div>
                </div>
              )}
              {newChatFeedback && (
                <p className={`text-[10px] font-black uppercase tracking-widest ${newChatFeedback.type === 'error' ? 'text-red-500' : 'text-[var(--color-accent)]'} ml-1`}>
                  {newChatFeedback.text}
                </p>
              )}
            </div>

            <button
              onClick={searchedUser ? handleSendRequest : handleSearchUser}
              disabled={isSearchingUser || (!searchedUser && !newChatEmail.trim())}
              className="w-full py-4 rounded-xl bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--color-accent)] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group z-10 relative"
            >
              {isSearchingUser ? (
                <><Loader2 size={16} className="animate-spin" /> {searchedUser ? 'Sending...' : 'Locating Node...'}</>
              ) : (
                searchedUser ? 'Send Request' : 'Search User'
              )}
            </button>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showMembersModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMembersModal(false)} 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-hidden"
          >
             <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-black italic tracking-tight">Group Members</h3>
                <button onClick={() => setShowMembersModal(false)} className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100">Close</button>
             </div>
             
             <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                {isFetchingParticipants ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--color-accent)]" /></div>
                ) : (
                  participants.map(p => (
                    <div 
                       key={p.id} 
                       className={`flex flex-col gap-2 p-3 bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border)] group ${p.id !== user?.id ? 'cursor-pointer hover:border-[var(--color-accent)] transition-all' : ''}`}
                       onClick={() => p.id !== user?.id && handleStartDirectChat(p.id)}
                     >
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Avatar name={p.name} src={p.avatar_url ? storageService.getPublicUrl(p.avatar_url) : undefined} size="sm" />
                              <div>
                                 <p className="text-sm font-black tracking-tight flex items-center gap-2 group-hover:text-[var(--color-accent)] transition-colors">
                                   {p.name} {p.id === user?.id && <span className="opacity-40 font-normal">(You)</span>}
                                 </p>
                                 <div className="flex items-center gap-2">
                                    <Badge variant={p.role === 'ADMIN' ? 'blue' : 'sage'}>{p.role || 'MEMBER'}</Badge>
                                    {p.title && <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{p.title}</span>}
                                 </div>
                              </div>
                           </div>
                        </div>
                       {selectedConversation?.role === 'ADMIN' && p.id !== user?.id && (user?.id === selectedConversation?.admin_id || p.id !== selectedConversation?.admin_id) && (
                          <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                            {p.role !== 'ADMIN' ? (
                              <button 
                                onClick={() => handleMakeAdmin(p.id)}
                                className="flex-1 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[9px] font-black uppercase tracking-widest rounded-lg hover:border-[var(--color-accent)] transition-all"
                              >
                                Make Admin
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleRemoveAdmin(p.id)}
                                className="flex-1 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[9px] font-black uppercase tracking-widest rounded-lg hover:border-red-500 transition-all text-red-500"
                              >
                                Remove Admin
                              </button>
                            )}
                            <button 
                              onClick={() => handleRemoveMember(p.id)}
                              className="flex-1 py-2 bg-red-500/5 text-red-500 border border-red-500/10 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                              Remove
                            </button>
                          </div>
                       )}
                       {p.id === selectedConversation?.admin_id && (
                          <div className="pt-2 border-t border-[var(--color-border)]">
                             <p className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-600 text-center">Group Creator</p>
                          </div>
                       )}
                    </div>
                  ))
                )}
             </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
      
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        mode={confirmModal.mode}
      />

      <AnimatePresence>
      {showLocationSearch && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowLocationSearch(false)} 
           />
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
             className="relative bg-[var(--color-bg-secondary)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl w-full max-w-xl overflow-hidden"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="p-8 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/50">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif font-black italic">Search Location</h2>
                    <button onClick={() => setShowLocationSearch(false)} className="p-2 hover:bg-black/5 rounded-full transition-all">
                       <X size={24} />
                    </button>
                 </div>
                 <div className="relative">
                    <input 
                      type="text" 
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                      placeholder="Search for cafes, malls, restaurants or addresses..."
                      className="w-full pl-14 pr-6 py-5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm focus:border-[var(--color-accent)] transition-all outline-none"
                    />
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                    <button 
                      onClick={handleSearchLocation}
                      disabled={isSearchingLocationSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-accent)] text-white rounded-xl hover:bg-black transition-all"
                    >
                      {isSearchingLocationSearch ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                 </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {locationResults.length === 0 && !isSearchingLocationSearch ? (
                    <div className="py-20 text-center opacity-40">
                       <MapPin size={48} className="mx-auto mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No results yet</p>
                    </div>
                 ) : (
                    <div className="space-y-2">
                       {locationResults.map((loc: any, i: number) => (
                          <button 
                            key={i}
                            onClick={() => selectLocation(loc.lat, loc.lon, loc.display_name)}
                            disabled={isSendingLocation}
                            className="w-full text-left p-4 hover:bg-[var(--color-bg-primary)] rounded-2xl border border-transparent hover:border-[var(--color-border)] transition-all group disabled:opacity-50"
                          >
                             <div className="flex gap-4 items-center">
                                <div className="p-3 bg-black/5 rounded-xl group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all">
                                   <MapPin size={20} />
                                </div>
                                <div>
                                   <p className="text-sm font-bold truncate max-w-md">{loc.display_name}</p>
                                   <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">
                                      {loc.type && loc.type !== 'yes' ? `${loc.type.replace('_', ' ')} • ` : ''}
                                      Lat: {parseFloat(loc.lat).toFixed(4)}, Lon: {parseFloat(loc.lon).toFixed(4)}
                                   </p>
                                </div>
                             </div>
                          </button>
                       ))}
                    </div>
                 )}
              </div>
           </motion.div>
        </div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {showMeetingModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowMeetingModal(false)} 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl">
                  <Calendar size={24} />
                </div>
                <button onClick={() => setShowMeetingModal(false)} className="p-2 hover:bg-[var(--color-bg-primary)] rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              <h3 className="text-xl font-black tracking-tight">Schedule meeting</h3>
              <p className="text-[10px] font-black opacity-40 mt-1">Set up a video call for this collab</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-[9px] font-black opacity-40 ml-1">Meeting Topic</span>
                <input 
                  type="text" 
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g., Project Sync / Design Review"
                  className="w-full px-6 py-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm font-medium focus:border-orange-500 outline-none transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="space-y-2">
                <span className="text-[9px] font-black opacity-40 ml-1">Date & Time</span>
                <CustomDateTimePicker 
                   value={meetingDateTime}
                   onChange={(val) => setMeetingDateTime(val)}
                   minDate={new Date().toISOString()}
                />
              </div>

              <button 
                onClick={handleScheduleMeeting}
                disabled={isSchedulingMeeting || !meetingTitle || !meetingDateTime}
                className="w-full py-5 bg-orange-500 text-white text-[10px] font-black tracking-[0.1em] rounded-2xl hover:bg-orange-600 disabled:opacity-40 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-3"
              >
                {isSchedulingMeeting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Video size={18} />
                    Schedule meeting
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </>
  )
}
