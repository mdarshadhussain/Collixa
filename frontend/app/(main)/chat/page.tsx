'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Send, Plus, MoreVertical, Search, ArrowLeft, MessageCircle, X, Loader2 } from 'lucide-react'
import Badge from '@/components/Badge'
import { useAuth } from '@/app/context/AuthContext'
import { conversationService, messageService, supabase, userService } from '@/lib/supabase'
import Typewriter from '@/components/Typewriter'
import Avatar from '@/components/Avatar'

interface UIMessage {
  id: number
  author: string
  avatar: string
  content: string
  timestamp: string
  isOwn: boolean
}

interface UIConversation {
  id: number
  name: string
  avatar: string
  lastMessage: string
  unread: number
  status: 'online' | 'offline'
  chatStatus?: 'PENDING' | 'ACCEPTED'
  chatType: 'DIRECT' | 'GROUP'
  isSender?: boolean
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
              chatType: 'GROUP'
            }
          }

          // Because getConversations has a join, participant_1 is an object at runtime
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
            chatStatus: conv.status || 'ACCEPTED',
            chatType: 'DIRECT',
            isSender: isUserP1
          }
        })
        
        setConversations(mapped)
        
        // Auto-select based on URL ID or first conversation
        setSelectedConversation(currentSelected => {
          if (!currentSelected && mapped.length > 0) {
            const target = chatIdFromUrl 
              ? mapped.find(c => c.id.toString() === chatIdFromUrl) || mapped[0]
              : mapped[0]
              
            if (chatIdFromUrl) {
              setMobileShowConversations(false)
            } else {
              setMobileShowConversations(true)
            }
            return target
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

    // Realtime listener for conversations updates
    const convoChannel = supabase.channel(`conversations_usr_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          // Re-fetch everything safely
          loadConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(convoChannel)
    }
  }, [user]) // Only remount on user change

  // Fetch messages when conversation clicked and setup realtime watcher
  useEffect(() => {
    if (!selectedConversation || !user) return

    const loadMessages = async () => {
      try {
        const rawMessages = await messageService.getMessages(selectedConversation.id)
        const mapped: UIMessage[] = rawMessages.map(m => {
          const isOwn = m.sender_id === user.id
          const senderName = isOwn ? 'You' : (m.sender?.name || 'User')
          
          return {
            id: m.id,
            content: m.content,
            isOwn: isOwn,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            author: senderName,
            avatar: isOwn 
              ? (user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=User`)
              : (m.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderName}`)
          }
        })
        setMessages(mapped)
      } catch(err) {
        console.error('Failed to load messages:', err)
      }
    }

    loadMessages()
    
    // Mark as read when entering conversation
    const markRead = async () => {
      await messageService.markAsRead(selectedConversation.id)
    }
    markRead()

    // Subscribe to new messages for this conversation (instant delivery)
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
            return [...prev, {
              id: m.id,
              content: m.content,
              isOwn: m.sender_id === user.id,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              author: m.sender_id === user.id ? 'You' : selectedConversation.name,
              avatar: m.sender_id === user.id 
                ? (user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=User`)
                : selectedConversation.avatar
            }]
         })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConversation, user])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return

    const content = newMessage.trim()
    setNewMessage('') // Fast optimistic clear
    
    // Add optimistic local message instantly before DB completes round trip
    const tempMsg: UIMessage = {
      id: Date.now(), // Temporary ID until refresh
      author: 'You',
      avatar: user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=User`,
      content: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    }
    setMessages(prev => [...prev, tempMsg])

    // Update conversation sidebar locally (optimistic)
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: content }
          : conv
      )
    )

    try {
      await messageService.sendMessage(selectedConversation.id, user.id, content)
      // We could optionally update conversation's last message on PG, but standard app architectures
      // often have a trigger or require a separate update wrapper if we specifically want `last_message` column modified.
      // E.g: await conversationService.updateConversation(selectedConversation.id, { last_message: content })
      await conversationService.updateConversation(selectedConversation.id, { last_message: content }) 
    } catch(err) {
      console.error('Message failed to jump:', err)
      // Error handling UI omitted for brevity, but could re-inject failed msgs here
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
      const conversation = await conversationService.getOrCreateDirectConversation(user.id, searchedUser.id)
      if (conversation) {
        setIsNewChatModalOpen(false)
        setMobileShowConversations(false)
        setNewChatEmail('')
        setSearchedUser(null)
        router.push(`/chat?id=${conversation.id}`)
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
    if (!window.confirm('Warning: Clearing this chat will permanently remove all messages on both sending and receiving sides. Continue?')) return
    const success = await conversationService.clearChat(selectedConversation.id)
    if (success) {
      setMessages([])
      setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, lastMessage: '' } : c))
    }
  }

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return
    setIsChatMenuOpen(false)
    const mode = selectedConversation.chatType === 'GROUP' ? 'leave this group' : 'delete this user'
    if (!window.confirm(`Are you sure you want to permanently ${mode} from your list?`)) return
    if (!user) return
    const success = await conversationService.leaveConversation(selectedConversation.id, user.id)
    if (success) {
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id))
      setSelectedConversation(null)
      setMobileShowConversations(true)
      router.push('/chat')
    }
  }

  return (
    <>
      <div className="h-[calc(100vh-160px)] flex gap-4 overflow-hidden">
            
            <div
              className={`w-full md:w-80 lg:w-96 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm transition-all ${
                mobileShowConversations ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div className="p-8 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-serif font-black tracking-tighter">
                    <Typewriter text="Messages." speed={0.06} delay={0.2} />
                  </h2>
                  <button onClick={() => setIsNewChatModalOpen(true)} className="p-3 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent)] hover:text-[var(--color-inverse-text)] transition-all">
                    <Plus size={20} />
                  </button>
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-accent)] transition-colors opacity-40" size={18} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-[var(--color-text-secondary)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">No matches found.</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
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
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
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
                      <div>
                        <h3 className="text-lg font-serif font-black tracking-tight">{selectedConversation.name}</h3>
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
                    {selectedConversation.chatStatus === 'PENDING' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-primary)]/80 backdrop-blur-sm z-20">
                         <div className="text-center p-8 bg-[var(--color-bg-secondary)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl max-w-sm w-full mx-4">
                            {selectedConversation.isSender ? (
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
                                  <button onClick={async () => {
                                    await conversationService.acceptMessageRequest(selectedConversation.id)
                                    setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, chatStatus: 'ACCEPTED' } : c))
                                    setSelectedConversation(prev => prev ? { ...prev, chatStatus: 'ACCEPTED' } : null)
                                  }} className="w-full py-3 bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[var(--color-inverse-bg)] shadow-lg transition-all">Accept Request</button>
                                  <button onClick={handleDeleteConversation} className="w-full py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)] transition-all">Decline</button>
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
                      messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex flex-col ${msg.isOwn ? 'items-end' : ''}`}>
                            <div className={`max-w-[16rem] md:max-w-md px-6 py-4 rounded-3xl shadow-sm ${msg.isOwn ? 'bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-tr-none' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-tl-none'}`}>
                              <p className="text-sm font-medium">{msg.content}</p>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mt-2 opacity-40">{msg.timestamp}</span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 pb-24 md:p-6 md:pb-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div className="flex gap-2.5 md:gap-4 items-center">
                      <button className="p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-2xl hover:text-[var(--color-accent)] transition-all flex-shrink-0"><Plus size={20} /></button>
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
        
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNewChatModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-hidden">
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-1">User Email Address</label>
                  <div className="relative flex items-center group">
                    <Search className="absolute left-4 text-[var(--color-accent)] opacity-60 group-focus-within:opacity-100 transition-opacity" size={16} />
                    <input
                      type="email"
                      placeholder="e.g. peer@collixa.com"
                      value={newChatEmail}
                      onChange={(e) => setNewChatEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                      className="w-full pl-10 pr-4 py-3.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm font-medium focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <div className="p-4 border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-primary)] flex items-center gap-4">
                  <Avatar name={searchedUser.name} src={searchedUser.avatar_url} size="md" />
                  <div>
                    <h4 className="font-black text-sm tracking-tight">{searchedUser.name}</h4>
                    <p className="text-[10px] text-[var(--color-text-secondary)]">{searchedUser.email}</p>
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
          </div>
        </div>
      )}
      </div>
    </>
  )
}
