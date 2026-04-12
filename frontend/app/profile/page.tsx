'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, MessageCircle, Share2, Star, MapPin, Briefcase, Calendar, ArrowLeft, ArrowUpRight, FileUp, Loader2, Save, X } from 'lucide-react'
import Header from '@/components/Header'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import { Intent, storageService } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, token, refreshUser, updateUser } = useAuth()
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'intents' | 'skills' | 'reviews'>('intents')
  const [myIntents, setMyIntents] = useState<Intent[]>([])
  const [loadingIntents, setLoadingIntents] = useState(true)

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || ''
      })
      setAvatarPreview(user.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : storageService.getPublicUrl(user.avatar_url)) : null)
    }
  }, [user])

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (!token) return
    setIsSaving(true)
    try {
      let finalAvatarUrl = user?.avatar_url || ''

      // 1. Upload new avatar if changed
      if (avatarFile) {
        console.log('Uploading avatar...', avatarFile.name)
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `avatar-${user?.id}-${Date.now()}.${fileExt}`
        const storagePath = `profiles/${fileName}`
        const uploadedPath = await storageService.uploadFile(avatarFile, storagePath)
        
        if (uploadedPath) {
          finalAvatarUrl = uploadedPath
          console.log('Avatar uploaded successfully:', finalAvatarUrl)
        } else {
          console.error('Avatar upload failed')
          alert('Failed to upload the image. Please ensure you have a "attachments" bucket in your Supabase storage.')
          // We shouldn't proceed if they intended to change the image but it failed
          setIsSaving(false)
          return
        }
      }

      // 2. Update profile via API
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editForm,
          avatar_url: finalAvatarUrl
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.user) {
          updateUser(result.user)
        }
        setIsEditing(false)
      } else {
        const errorText = await response.text()
        let errorMessage = 'Server returned an error'
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error === 'Validation failed' && errorData.details) {
            errorMessage = `Validation Error: ${errorData.details.map((d: any) => d.msg).join(', ')}`
          } else {
            errorMessage = errorData.error || errorData.message || errorMessage
          }
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        console.error('Profile update failed:', errorMessage)
        alert(errorMessage)
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      alert(`Connection Error: ${err.message || 'The server on port 5000 is not responding'}`)
    } finally {
      setIsSaving(false)
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
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-10 rounded-[3rem] shadow-2xl shadow-[var(--color-accent)]/5 text-center relative overflow-hidden">
              
              {isEditing ? (
                <div className="space-y-6">
                  <div className="relative group mx-auto w-32 h-32 mb-8">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-[var(--color-accent)] group-hover:opacity-50 transition-opacity">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Avatar name={editForm.name || 'User'} size="xl" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                       <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                       <div className="bg-[var(--color-bg-primary)]/80 p-3 rounded-full text-[var(--color-accent)] shadow-xl">
                          <FileUp size={20} />
                       </div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="text-left">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] ml-4 mb-2 block">Identity Name</label>
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-xs font-bold focus:border-[var(--color-accent)] outline-none" 
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="text-left">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] ml-4 mb-2 block">Origin / Location</label>
                      <input 
                        type="text" 
                        value={editForm.location} 
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-xs font-bold focus:border-[var(--color-accent)] outline-none" 
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="text-left">
                      <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] ml-4 mb-2 block">Mission / Bio</label>
                      <textarea 
                        value={editForm.bio} 
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-xs font-medium focus:border-[var(--color-accent)] outline-none min-h-[120px] resize-none" 
                        placeholder="Tell the community about your goals..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                     <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-4 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                      >
                        <X size={14} /> Cancel
                     </button>
                     <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex-1 py-4 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[var(--color-text-primary)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Record
                     </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-8 relative group">
                    <Avatar name={user.name || 'User'} src={user.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : storageService.getPublicUrl(user.avatar_url)) : undefined} size="xl" className="ring-4 ring-[var(--color-accent-soft)]" />
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="absolute bottom-0 right-1/2 translate-x-12 translate-y-2 p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[var(--color-accent)] shadow-xl hover:scale-110 transition-all"
                    >
                       <Edit2 size={16} />
                    </button>
                  </div>
                  <h1 className="text-3xl font-serif font-black text-[var(--color-text-primary)] mb-2">{user.name || 'User'}</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)] mb-4">{user.email}</p>
                  
                  {user.location && (
                    <div className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-widest mb-6">
                      <MapPin size={12} className="text-[var(--color-accent)]" />
                      {user.location}
                    </div>
                  )}

                  {user.bio && (
                    <p className="text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed italic mb-8 border-t border-b border-[var(--color-border)] py-6 line-clamp-3">
                      "{user.bio}"
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-6 pt-10">
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
                     <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full py-5 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[var(--color-text-primary)] transition-all rounded-2xl"
                      >
                        Edit Statistics & Identity
                     </button>
                     <button className="w-full py-5 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[10px] font-black uppercase tracking-[0.3em] hover:text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-3 rounded-2xl">
                        <Share2 size={14} /> Share Packet
                     </button>
                  </div>
                </>
              )}
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
