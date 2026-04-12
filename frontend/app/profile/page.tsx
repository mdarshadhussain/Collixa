'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, MessageCircle, Share2, Star, MapPin, Briefcase, Calendar, ArrowLeft, ArrowUpRight } from 'lucide-react'
import Header from '@/components/Header'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import type { Intent } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, token } = useAuth()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'intents' | 'skills' | 'reviews'>('intents')
  const [myIntents, setMyIntents] = useState<Intent[]>([])
  const [loadingIntents, setLoadingIntents] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (token) {
      fetchMyIntents()
    }
  }, [token])

  const fetchMyIntents = async () => {
    setLoadingIntents(true)
    try {
      const response = await fetch(`${API_URL}/api/intents/user/my-intents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setMyIntents(data.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingIntents(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const joinDate = user.created_at
    ? `Joined ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'Member since launch'

  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen transition-colors duration-700 font-sans">
      <Header />

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        {/* Back */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all mb-12"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Sanctuary
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Profile Sidebar/Header Area */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-10 rounded-[3rem] shadow-2xl shadow-[var(--color-accent)]/5 text-center">
              <div className="flex justify-center mb-8 relative group">
                <Avatar name={user.name || 'User'} size="xl" className="ring-4 ring-[var(--color-accent-soft)]" />
                <div className="absolute bottom-0 right-1/2 translate-x-12 translate-y-2 p-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[var(--color-accent)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                   <Edit2 size={14} />
                </div>
              </div>
              <h1 className="text-3xl font-serif font-black text-[var(--color-text-primary)] mb-2">{user.name || 'User'}</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mb-8">{user.email}</p>
              
              <div className="grid grid-cols-2 gap-6 pt-10 border-t border-[var(--color-border)]">
                 <div className="text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-2">Deployed</p>
                    <p className="text-xl font-serif font-black">{myIntents.length}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-2">Rating</p>
                    <p className="text-xl font-serif font-black">4.9</p>
                 </div>
              </div>

              <div className="mt-12 space-y-4">
                 <button className="w-full py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--color-text-primary)] transition-all">
                    Edit Profile
                 </button>
                 <button className="w-full py-5 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[10px] font-black uppercase tracking-[0.3em] hover:text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-3">
                    <Share2 size={14} /> Share Packet
                 </button>
              </div>
            </div>

            <div className="bg-[var(--color-accent-soft)]/10 border border-[var(--color-accent-soft)] p-8 rounded-[2.5rem]">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-4">Membership Archive</p>
               <p className="text-sm font-serif italic text-[var(--color-text-primary)]">{joinDate}</p>
            </div>
          </div>

          {/* Activity Area */}
          <div className="lg:col-span-8 flex flex-col space-y-10">
            {/* Tabs */}
            <div className="flex gap-8 border-b border-[var(--color-border)]">
              {['intents', 'skills', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-6 text-[10px] font-black uppercase tracking-[0.4em] border-b-2 transition-all ${
                    activeTab === tab
                      ? 'text-[var(--color-accent)] border-[var(--color-accent)]'
                      : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content Pane */}
            <div className="space-y-8 min-h-[500px]">
              {activeTab === 'intents' && (
                <div className="grid grid-cols-1 gap-8">
                  {loadingIntents ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="h-40 bg-[var(--color-bg-secondary)] rounded-[2.5rem] border border-[var(--color-border)] animate-pulse" />
                    ))
                  ) : myIntents.length > 0 ? (
                    myIntents.map((intent) => (
                      <div 
                        key={intent.id} 
                        className="group bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] p-10 rounded-[2.5rem] hover:shadow-2xl transition-all duration-700 cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8" 
                        onClick={() => router.push(`/intent/${intent.id}`)}
                      >
                        <div className="space-y-4 flex-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">{intent.category || 'General'}</span>
                          <h3 className="text-2xl font-serif font-black text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{intent.title}</h3>
                          <div className="flex items-center gap-6">
                            <Badge variant={intent.status === 'completed' ? 'gray' : 'green'} className="text-[8px] tracking-[0.2em]">
                              {intent.status === 'completed' ? 'Fulfilled' : 'Active'}
                            </Badge>
                            {intent.created_at && (
                              <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-widest">
                                <Calendar size={14} />
                                <span>{new Date(intent.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-700">
                           <ArrowUpRight size={28} className="text-[var(--color-accent)]" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-border)] p-24 rounded-[3rem] text-center">
                      <Briefcase size={56} className="mx-auto text-[var(--color-border)] mb-8" />
                      <h3 className="text-3xl font-serif italic text-[var(--color-text-primary)] mb-4">No active broadcasts.</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-12">Initialize your first collaboration intent.</p>
                      <button 
                        onClick={() => router.push('/create')}
                        className="px-10 py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--color-text-primary)] transition-all"
                      >
                         Initiate BroadCast
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-12 rounded-[3rem] text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)]">Skill Proficiency Archive <br /><span className="italic font-light">(Restricted Access)</span></p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-12 rounded-[3rem] text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)]">Reputation Ledger <br /><span className="italic font-light">(Pending Endorsements)</span></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
