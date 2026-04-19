'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, ArrowRight, MessageCircle, Zap, ShieldAlert, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Notification {
  id: string
  type: 'SKILL_REQUEST' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'NEW_MESSAGE' | 'ACHIEVEMENT_UNLOCKED'
  title: string
  content: string
  link: string
  is_read: boolean
  created_at: string
}

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return

      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    // Real-time updates
    const channel = supabase
      .channel('notifications-drawer')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications' 
      }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      // Optimistically remove from list
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const clearAll = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setNotifications([])
    } catch (err) {
      console.error('Failed to clear notifications:', err)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'SKILL_REQUEST': return <Zap size={16} className="text-yellow-500" />
      case 'REQUEST_ACCEPTED': return <Check size={16} className="text-green-500" />
      case 'REQUEST_REJECTED': return <X size={16} className="text-red-500" />
      case 'NEW_MESSAGE': return <MessageCircle size={16} className="text-blue-500" />
      case 'ACHIEVEMENT_UNLOCKED': return <Zap size={16} className="text-purple-500" />
      default: return <Bell size={16} className="text-[var(--color-accent)]" />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full sm:w-[400px] bg-[var(--color-bg-primary)] border-l border-[var(--color-border)] shadow-2xl z-[201] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-secondary)]/50">
              <div>
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)]">Activity Centre.</h2>
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] mt-1">
                  {notifications.length} Unread alerts
                </p>
              </div>
              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-red-500 transition-colors px-3 py-1.5 rounded-full hover:bg-black/5"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <Loader2 size={32} className="animate-spin mb-4 text-[var(--color-accent)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center px-12 text-center opacity-40">
                  <div className="w-20 h-20 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mb-6">
                    <ShieldAlert size={40} />
                  </div>
                  <h3 className="text-[14px] font-black uppercase tracking-[0.1em] mb-2 text-[var(--color-text-primary)]">All Caught Up</h3>
                  <p className="text-[10px] font-medium leading-relaxed">Your inbox is clear. New collaboration alerts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <motion.div 
                      key={n.id} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group p-4 rounded-2xl hover:bg-[var(--color-bg-secondary)] transition-all border border-transparent hover:border-[var(--color-border)] relative"
                    >
                      <div className="flex gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--color-accent)] transition-all shadow-sm">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-[11px] font-extrabold text-[var(--color-text-primary)] tracking-tight">{n.title}</h4>
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-[10px] font-medium text-[var(--color-text-secondary)] mb-4 leading-relaxed opacity-80">{n.content}</p>
                          {n.link && (
                            <Link 
                              href={n.link}
                              onClick={() => {
                                markAsRead(n.id)
                                onClose()
                              }}
                              className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:opacity-70 transition-opacity"
                            >
                              Take Action <ArrowRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] group-hover:opacity-0 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-50">
                End of notifications
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
