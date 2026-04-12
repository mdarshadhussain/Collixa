'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Plus, Phone, Video, MoreVertical, Search, ArrowLeft, MessageCircle } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useTheme } from '@/app/context/ThemeContext'
import { useAuth } from '@/app/context/AuthContext'
import { conversationService, messageService, supabase } from '@/lib/supabase'

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
}

export default function ChatPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  const [conversations, setConversations] = useState<UIConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<UIConversation | null>(null)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [mobileShowConversations, setMobileShowConversations] = useState(true)
  
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
              name: conv.title || 'Project Group',
              avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.title || 'Project'}`,
              lastMessage: conv.last_message || 'Project group created.',
              unread: 0,
              status: 'online'
            }
          }

          // Because getConversations has a join, participant_1 is an object at runtime
          const p1 = typeof conv.participant_1 === 'object' ? conv.participant_1 : null
          const p2 = typeof conv.participant_2 === 'object' ? conv.participant_2 : null
          
          const isUserP1 = p1?.id === user.id
          const other = isUserP1 ? p2 : p1
          
          return {
            id: conv.id,
            name: other?.name || 'Unknown User',
            avatar: other?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.name || 'Unknown'}`,
            lastMessage: conv.last_message || 'New Match!',
            unread: 0,
            status: 'online'
          }
        })
        
        setConversations(mapped)
        
        // Auto-select first conversation linearly
        if (mapped.length > 0 && !selectedConversation) {
          setSelectedConversation(mapped[0])
          setMobileShowConversations(false)
        }
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
  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] h-screen overflow-hidden transition-colors duration-700 font-sans flex flex-col">
      <Header />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-8 pb-8 gap-8 overflow-hidden">
        
        <Sidebar />

        {/* Messaging Container */}
        <div className="flex-1 flex gap-4 overflow-hidden">
            
            {/* Conversations List */}
            <div
              className={`w-full md:w-80 lg:w-96 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm transition-all ${
                mobileShowConversations ? 'flex' : 'hidden md:flex'
              }`}
            >
              <div className="p-8 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif font-black tracking-tight">Messages.</h2>
                  <button className="p-3 bg-[var(--color-accent-soft)] text-[var(--color-accent)] rounded-2xl hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-all">
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
                        selectedConversation?.id === conv.id ? 'bg-[var(--color-accent-soft)]/30 border-l-4 border-l-[var(--color-accent)]' : ''
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
                              <span className="px-2 py-0.5 min-w-[1.25rem] text-center text-[8px] font-black bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-full">
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
            <div className={`flex-1 flex flex-col bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] overflow-hidden shadow-sm ${!mobileShowConversations || !mobileShowConversations ? 'flex' : 'hidden md:flex'}`}>
              {selectedConversation ? (
                <>
                  <div className="px-8 py-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]/50 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4 flex-1">
                      <button onClick={() => setMobileShowConversations(true)} className="md:hidden p-3 text-[var(--color-accent)]"><ArrowLeft size={20} /></button>
                      <Avatar name={selectedConversation.name} src={selectedConversation.avatar} size="lg" />
                      <div>
                        <h3 className="text-lg font-serif font-black tracking-tight">{selectedConversation.name}</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)]">{selectedConversation.status === 'online' ? 'Online' : 'Offline'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4">
                      <button className="p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all"><Phone size={20} /></button>
                      <button className="p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all"><Video size={20} /></button>
                      <button className="p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all"><MoreVertical size={20} /></button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-[var(--color-bg-primary)]/20 relative">
                    {messages.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center p-8 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md rounded-[2.5rem] border border-[var(--color-border)]">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">Begin synchronizing.</span>
                         </div>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex flex-col ${msg.isOwn ? 'items-end' : ''}`}>
                            <div className={`max-w-[16rem] md:max-w-md px-6 py-4 rounded-3xl shadow-sm ${msg.isOwn ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-tr-none' : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-tl-none'}`}>
                              <p className="text-sm font-medium">{msg.content}</p>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mt-2 opacity-40">{msg.timestamp}</span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 md:p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
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
                      <button onClick={handleSendMessage} disabled={!newMessage.trim()} className="p-4 bg-[var(--color-accent)] text-[var(--color-bg-primary)] rounded-2xl hover:bg-[var(--color-text-primary)] disabled:opacity-40 transition-all shadow-lg flex-shrink-0"><Send size={20} /></button>
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
      </div>
    </div>
  )
}
