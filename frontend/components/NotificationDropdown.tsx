'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, ArrowRight, MessageCircle, Zap, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import Avatar from './Avatar'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Notification {
  id: string
  type: 'SKILL_REQUEST' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'NEW_MESSAGE'
  title: string
  content: string
  link: string
  is_read: boolean
  created_at: string
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
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
    fetchNotifications()

    // Create a unique channel for this component instance
    const channelName = `notifications-${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(channelName)
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
      // Optimistically remove from list (as requested: "disappear")
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
      case 'SKILL_REQUEST': return <Zap size={14} className="text-yellow-500" />
      case 'REQUEST_ACCEPTED': return <Check size={14} className="text-green-500" />
      case 'REQUEST_REJECTED': return <X size={14} className="text-red-500" />
      case 'NEW_MESSAGE': return <MessageCircle size={14} className="text-blue-500" />
      default: return <Bell size={14} className="text-[var(--color-accent)]" />
    }
  }

  const unreadCount = notifications.length

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)] flex items-center justify-center transition-all bg-[var(--color-bg-secondary)] shadow-sm group"
      >
        <Bell size={20} className={`transition-all ${unreadCount > 0 ? 'text-[var(--color-accent)] animate-bounce-subtle' : 'text-[var(--color-text-secondary)]'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full ring-4 ring-[var(--color-bg-primary)]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-6 w-80 md:w-96 bg-[var(--color-bg-secondary)] rounded-[2.5rem] shadow-2xl border border-[var(--color-border)] p-4 z-[200] animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)]">Activity.</h3>
              <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] mt-1">{unreadCount} New alerts</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={clearAll}
                className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center opacity-40">
                <Bell size={24} className="mx-auto animate-pulse mb-4" />
                <span className="text-[8px] font-black uppercase tracking-widest">Synchronizing...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center opacity-40">
                <ShieldAlert size={32} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Silence is golden.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {notifications.map((n) => (
                  <div key={n.id} className="p-6 hover:bg-[var(--color-bg-primary)] transition-all group relative">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 group-hover:border-[var(--color-accent)] transition-all">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-[10px] font-black text-[var(--color-text-primary)] leading-tight">{n.title}</p>
                          <button 
                            onClick={() => markAsRead(n.id)}
                            className="p-1 hover:bg-red-50 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-[9px] font-medium text-[var(--color-text-secondary)] mb-3 leading-relaxed opacity-80">{n.content}</p>
                        {n.link && (
                          <Link 
                            href={n.link}
                            onClick={() => markAsRead(n.id)}
                            className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:opacity-70 transition-opacity"
                          >
                            View Details <ArrowRight size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
