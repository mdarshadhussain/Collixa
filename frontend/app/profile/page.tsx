'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Edit2, MessageCircle, Share2, Star, MapPin, Briefcase, Calendar, ArrowLeft, ArrowUpRight, FileUp, Loader2, Save, X, QrCode, Copy, Plus } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Avatar from '@/components/Avatar'
import Typewriter from '@/components/Typewriter'
import CreditPurchaseModal from '@/components/CreditPurchaseModal'
import ShareCreditsModal from '@/components/ShareCreditsModal'
import AchievementsSection from '@/components/AchievementsSection'
import { useAuth } from '@/app/context/AuthContext'
import { Intent, storageService, conversationService } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const AVATAR_PRESETS = [
  'Abby', 'Angel', 'Bailey', 'Caleb', 'Daisy', 
  'Ethan', 'Faith', 'Gabe', 'Hazel', 'Issac'
].map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`)

const getLevelLabel = (level: number = 1) => {
  const labels: Record<number, string> = {
    1: 'Novice',
    2: 'Contributor',
    3: 'Collaborator',
    4: 'Professional',
    5: 'Master'
  }
  return labels[level] || 'Novice'
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileUid = searchParams.get('uid')
  const { user, isAuthenticated, loading: authLoading, token, refreshUser, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'intents' | 'skills' | 'reviews' | 'achievements'>('intents')
  const [myIntents, setMyIntents] = useState<Intent[]>([])
  const [loadingIntents, setLoadingIntents] = useState(true)
  const [userSkills, setUserSkills] = useState<any[]>([])
  const [loadingSkills, setLoadingSkills] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    location: '',
    age: '',
    gender: ''
  })
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [externalUser, setExternalUser] = useState<any | null>(null)
  const [loadingExternalUser, setLoadingExternalUser] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Derived state for the user being displayed
  const profileUser = profileUid && profileUid !== user?.id ? externalUser : user
  const isOwnProfile = !profileUid || profileUid === user?.id

  const handleStartChat = async () => {
    if (!user || !profileUser || isOwnProfile) return
    try {
      const conversation = await conversationService.getOrCreateDirectConversation(user.id, profileUser.id)
      if (conversation) {
        router.push('/chat')
      }
    } catch (err) {
      console.error('Failed to start chat:', err)
      notify.error('Could not initiate chat conversation.')
    }
  }

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    if (paymentStatus === 'success') {
      notify.success('🌟 Credits Successfully Purchased! Your contribution to the ecosystem is valued.')
      refreshUser()
      router.replace('/profile')
    } else if (paymentStatus === 'cancel') {
      console.log('Payment cancelled')
      router.replace('/profile')
    }
  }, [searchParams, router])

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        age: user.age || '',
        gender: user.gender || ''
      })
      const userAvatar = user.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : storageService.getPublicUrl(user.avatar_url)) : null
      setAvatarPreview(userAvatar)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !profileUid) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router, profileUid])

  useEffect(() => {
    if (token) {
      fetchMyIntents()
    }
  }, [token])

  const fetchUserSkills = async (userId: string) => {
    setLoadingSkills(true)
    try {
      const response = await fetch(`${API_URL}/api/skills/user/${userId}`)
      const data = await response.json()
      if (response.ok) {
        setUserSkills(data.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSkills(false)
    }
  }

  const fetchUserReviews = async (userId: string) => {
    setLoadingReviews(true)
    try {
      const response = await fetch(`${API_URL}/api/reviews/user/${userId}`)
      const data = await response.json()
      if (response.ok) {
        setReviews(data.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    const targetUserId = profileUid || user?.id
    if (targetUserId) {
      fetchUserSkills(targetUserId)
      if (targetUserId === user?.id) {
        fetchTransactionHistory()
      }
    }
  }, [profileUid, user?.id])

  const fetchTransactionHistory = async () => {
    if (!token) return
    setLoadingTransactions(true)
    try {
      const response = await fetch(`${API_URL}/api/credits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setTransactions(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  useEffect(() => {
    const fetchExternalUser = async () => {
      if (!profileUid || profileUid === user?.id) return
      
      setLoadingExternalUser(true)
      try {
        const response = await fetch(`${API_URL}/api/users/${profileUid}`)
        const data = await response.json()
        if (response.ok && data.data) {
          setExternalUser(data.data)
          fetchUserReviews(profileUid)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingExternalUser(false)
      }
    }

    fetchExternalUser()
    
    if (isOwnProfile && user?.id) {
       fetchUserReviews(user.id)
    }
  }, [profileUid, user?.id, isOwnProfile])

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
      let finalAvatarUrl = avatarPreview || user?.avatar_url || ''

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
          notify.error('Failed to upload the image. Please ensure you have a "attachments" bucket in your Supabase storage.')
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
        notify.error(errorMessage)
      }
    } catch (err: any) {
      console.error('Error updating profile:', err)
      notify.error(`Connection Error: ${err.message || 'The server is not responding'}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || (!user && !profileUid) || loadingExternalUser) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const profileShareUrl = profileUser
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/profile?uid=${profileUser.id}`
    : ''

  const joinDate = profileUser?.created_at
    ? `Joined ${new Date(profileUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'Member since launch'

  return (
    <div className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen transition-colors duration-700 font-sans">
      <Header />
      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-3 sm:px-4 md:px-8 py-5 md:py-8 gap-4 md:gap-8">
      <Sidebar />
      <main className="flex-1">
        {/* Back */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all mb-12"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Sanctuary
        </button>

        <div className="grid grid-cols-1 gap-8">
          {/* Profile Sidebar/Header Area */}
          <div className="space-y-6">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl shadow-[var(--color-accent)]/5 relative overflow-hidden">
              
              {isEditing && isOwnProfile ? (
                <div className="space-y-6">
                  <div className="relative group mx-auto w-32 h-32 mb-4">
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
                  
                  <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-4">Or choose a Preset</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xs mx-auto">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setAvatarPreview(url)
                          setAvatarFile(null)
                          // Extract seed/identity from preset if needed, 
                          // or just reset customization to defaults for this preset
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 overflow-hidden ${avatarPreview === url ? 'border-[var(--color-accent)]' : 'border-transparent'}`}
                      >
                        <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="text-left">
                      <label className="editorial-label">Identity Name</label>
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="editorial-input" 
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="text-left">
                      <label className="editorial-label">Origin / Location</label>
                      <input 
                        type="text" 
                        value={editForm.location} 
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        className="editorial-input" 
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-left">
                        <label className="editorial-label">Age</label>
                        <input 
                          type="number" 
                          value={editForm.age} 
                          onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                          className="editorial-input" 
                          placeholder="Years"
                        />
                      </div>
                      <div className="text-left">
                        <label className="editorial-label">Gender Identity</label>
                        <select 
                          value={editForm.gender} 
                          onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                          className="editorial-input appearance-none bg-[var(--color-bg-primary)]"
                        >
                          <option value="">Select Identity</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Fluid">Gender Fluid</option>
                          <option value="Hidden">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-left">
                      <label className="editorial-label">Mission / Bio</label>
                      <textarea 
                        value={editForm.bio} 
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        className="editorial-textarea" 
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
                        className="flex-1 py-4 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-[var(--color-inverse-bg)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Record
                     </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4 relative group">
                        <Avatar name={profileUser?.name || 'User'} src={profileUser?.avatar_url ? (profileUser.avatar_url.startsWith('http') ? profileUser.avatar_url : storageService.getPublicUrl(profileUser.avatar_url)) : undefined} size="xl" className="ring-4 ring-[var(--color-accent-soft)]" />
                        <button 
                          disabled={!isOwnProfile}
                          onClick={() => setIsEditing(true)}
                          className="absolute left-16 top-14 p-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[var(--color-accent)] shadow-xl hover:scale-110 transition-all disabled:opacity-40 disabled:hover:scale-100"
                        >
                           <Edit2 size={14} />
                        </button>
                        <div>
                     <div className="space-y-4">
                    <div className="space-y-2">
                       <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight leading-none">
                          {profileUser?.name}
                       </h1>
                       <div className="flex flex-wrap items-center gap-2">
                          <div className="px-3 py-1 bg-[var(--color-accent-soft)]/20 border border-[var(--color-accent)]/20 rounded-full">
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
                               Level {profileUser?.level || 1} • {getLevelLabel(profileUser?.level)}
                             </span>
                          </div>
                          {profileUser?.role === 'ADMIN' && (
                             <Badge variant="accent" className="text-[9px] font-black">Admin</Badge>
                          )}
                       </div>
                    </div>
                    {profileUser?.bio && (
                       <p className="text-xs md:text-sm text-[var(--color-text-secondary)] font-medium max-w-lg leading-relaxed">
                          {profileUser.bio}
                       </p>
                    )}
                  </div>         <div className="flex items-center gap-3">
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.14em] md:tracking-[0.2em] text-[var(--color-accent)]">{profileUser?.email || 'Community Member'}</p>
                            {profileUser?.age && (
                              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] opacity-60">• {profileUser.age}y</span>
                            )}
                            {profileUser?.gender && (
                              <span className="text-[10px] font-bold text-[var(--color-text-secondary)] opacity-60">• {profileUser.gender}</span>
                            )}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-accent)]/20 rounded-full shadow-sm">
                              <Star size={10} className="text-yellow-500 fill-yellow-500" />
                              <span className="text-[10px] font-black">{profileUser?.avg_rating > 0 ? profileUser.avg_rating.toFixed(1) : 'New'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {profileUser?.location && (
                        <div className="flex items-center gap-2 text-[var(--color-text-secondary)] text-[9px] md:text-[10px] font-bold uppercase tracking-[0.1em] md:tracking-widest mb-2">
                          <MapPin size={12} className="text-[var(--color-accent)]" />
                          {profileUser.location}
                        </div>
                      )}

                      {profileUser?.bio && (
                        <p className="text-[11px] md:text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed italic mb-4 border-t border-b border-[var(--color-border)] py-2 line-clamp-2 break-words">
                          "{profileUser.bio}"
                        </p>
                      )}
                    </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 lg:pt-0 lg:min-w-[260px]">
                     <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] md:tracking-[0.4em] text-[var(--color-text-secondary)] mb-1.5">Reputation</p>
                        <p className="text-lg md:text-xl font-serif font-black">{profileUser?.total_reviews ?? 0} <span className="text-[9px] font-sans opacity-40 italic">Reviews</span></p>
                     </div>
                     <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] md:tracking-[0.4em] text-[var(--color-text-secondary)] mb-1.5">Credits</p>
                        <p className="text-lg md:text-xl font-serif font-black inline-flex items-center gap-1">
                          {profileUser?.credits ?? 0}
                          {isOwnProfile && (
                            <>
                              <button
                                onClick={() => setShowShareModal(true)}
                                className="p-1.5 hover:bg-[var(--color-accent-soft)]/20 rounded-full transition-all group"
                                title="Share Credits"
                              >
                                <Share2 size={14} className="text-[var(--color-accent)] group-hover:scale-125 transition-transform" />
                              </button>
                              <button
                                onClick={() => setShowCreditModal(true)}
                                className="p-1.5 hover:bg-[var(--color-accent-soft)]/20 rounded-full transition-all group"
                                title="Get More Credits"
                              >
                                <Plus size={14} className="text-[var(--color-accent)] group-hover:scale-125 transition-transform" />
                              </button>
                            </>
                          )}
                        </p>
                     </div>

                     {!isOwnProfile && (
                       <div className="col-span-2 mt-2">
                         <button
                           onClick={handleStartChat}
                           className="w-full py-3.5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] md:tracking-[0.3em] hover:bg-[var(--color-inverse-bg)] transition-all rounded-xl flex items-center justify-center gap-2 border border-transparent shadow-xl"
                         >
                           <MessageCircle size={14} /> Message to Collaborate
                         </button>
                       </div>
                     )}
                  </div>

                  <div className="mt-0 lg:ml-4 space-y-3 lg:min-w-[240px]">
                     <button
                        onClick={() => setShowQrModal(true)}
                        className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[9px] font-black uppercase tracking-[0.16em] hover:text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-2 rounded-xl"
                     >
                        <QrCode size={12} /> View QR
                     </button>
                     {isOwnProfile && (
                     <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full py-3.5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] md:tracking-[0.3em] hover:bg-[var(--color-inverse-bg)] transition-all rounded-xl"
                      >
                        Edit Statistics & Identity
                     </button>
                     )}

                  </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-[var(--color-accent-soft)]/10 border border-[var(--color-accent-soft)] p-5 md:p-6 rounded-2xl md:rounded-[2rem]">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-4">Membership Archive</p>
               <p className="text-sm font-serif italic text-[var(--color-text-primary)]">{joinDate}</p>
            </div>
          </div>

          {/* Activity Area */}
          <div className="flex flex-col space-y-10">
            {/* Tabs */}
            <div className="flex gap-3 sm:gap-5 border border-[var(--color-border)] bg-[var(--color-bg-secondary)] rounded-xl px-3 sm:px-4 flex-wrap">
              {['intents', 'skills', 'reviews', 'achievements', ...(isOwnProfile ? ['history'] : [])].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.32em] border-b-2 transition-all ${
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
                      <div key={i} className="h-32 bg-[var(--color-bg-secondary)] rounded-2xl md:rounded-[2rem] border border-[var(--color-border)] animate-pulse" />
                    ))
                  ) : myIntents.length > 0 ? (
                    myIntents.map((intent) => (
                      <div 
                        key={intent.id} 
                        className="group bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] p-5 md:p-8 rounded-2xl md:rounded-[2rem] hover:shadow-2xl transition-all duration-700 cursor-pointer relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-8" 
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
                    <div className="bg-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-border)] p-10 md:p-16 rounded-2xl md:rounded-[2rem] text-center">
                      <Briefcase size={56} className="mx-auto text-[var(--color-border)] mb-8" />
                      <h3 className="text-3xl font-serif italic text-[var(--color-text-primary)] mb-4">No active broadcasts.</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-12">Initialize your first collaboration intent.</p>
                      <button 
                        onClick={() => router.push('/create')}
                        className="px-10 py-5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[var(--color-inverse-bg)] transition-all"
                      >
                         Initiate BroadCast
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loadingSkills ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-[var(--color-accent)]" /></div>
                  ) : userSkills.length > 0 ? (
                    userSkills.map((skill) => (
                      <div key={skill.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 rounded-2xl md:rounded-[2rem] hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-accent)]">{skill.category}</span>
                            <h4 className="text-lg font-serif font-black">{skill.name}</h4>
                          </div>
                          <div className="bg-[var(--color-bg-primary)] px-2.5 py-1 rounded-full border border-[var(--color-border)] flex items-center gap-1.5">
                            <Star size={10} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-[10px] font-bold">{skill.avg_rating > 0 ? skill.avg_rating.toFixed(1) : 'New'}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] italic leading-relaxed mb-4 line-clamp-3">"{skill.description}"</p>
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]/50">
                           <span className="px-3 py-1 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] text-[8px] font-black uppercase rounded-lg">{skill.level}</span>
                           <span className="text-[9px] font-bold text-[var(--color-text-secondary)]">Since {new Date(skill.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full bg-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-border)] p-12 rounded-2xl text-center italic text-[var(--color-text-secondary)]">
                      No proficiency records published yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {loadingReviews ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[var(--color-accent)]" /></div>
                  ) : reviews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 text-left">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 rounded-2xl md:rounded-[2rem]">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={review.reviewer_name} src={review.reviewer_avatar ? (review.reviewer_avatar.startsWith('http') ? review.reviewer_avatar : storageService.getPublicUrl(review.reviewer_avatar)) : undefined} size="sm" />
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest">{review.reviewer_name}</p>
                                 <p className="text-[8px] text-[var(--color-text-secondary)]">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={10} className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                                ))}
                              </div>
                              <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${review.type === 'INTENT' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {review.type || 'Review'}
                              </span>
                            </div>
                          </div>
                          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-primary)]/40 p-4 rounded-xl border border-[var(--color-border)]/30">
                            {review.comment || "Endorsed with a 5-star rating."}
                          </p>
                          {(review.skill_name || review.intent_title) && (
                            <div className="mt-3 flex items-center gap-2">
                               <span className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                                 {review.type === 'INTENT' ? 'Project:' : 'Skill:'}
                               </span>
                               <span className="text-[8px] font-black uppercase text-[var(--color-accent)]">
                                 {review.intent_title || review.skill_name}
                               </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[var(--color-bg-secondary)] border-2 border-dashed border-[var(--color-border)] p-12 rounded-2xl text-center italic text-[var(--color-text-secondary)]">
                      Reputation Ledger is currently empty.
                    </div>
                  )}
                </div>
              )}

              {/* Achievements Tab */}
              {activeTab === 'achievements' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)]">Achievement Gallery</h3>
                    {isOwnProfile && (
                      <button
                        onClick={() => router.push('/rewards')}
                        className="group flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-[var(--color-accent)] hover:text-[var(--color-inverse-text)] transition-all"
                      >
                        View Platform Rewards
                      </button>
                    )}
                  </div>
                  <AchievementsSection userId={profileUser?.id} />
                </div>
              )}

              {activeTab === 'history' && isOwnProfile && (
                <div className="space-y-6 animate-in fade-in duration-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--color-text-primary)]">Credit History</h3>
                    <div className="px-3 py-1 bg-[var(--color-accent-soft)]/20 rounded-full border border-[var(--color-accent-soft)]">
                      <span className="text-[10px] font-black text-[var(--color-accent)]">{transactions.length} Records</span>
                    </div>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/5 border-b border-[var(--color-border)]">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Activity</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] text-right">Adjustment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {loadingTransactions ? (
                            [1, 2, 3].map((i) => (
                              <tr key={i} className="animate-pulse">
                                <td colSpan={3} className="px-6 py-8">
                                  <div className="h-4 bg-[var(--color-bg-secondary)]/5 rounded w-full" />
                                </td>
                              </tr>
                            ))
                          ) : transactions.length > 0 ? (
                            transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-[var(--color-bg-secondary)]/5 transition-colors">
                                <td className="px-6 py-5 text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
                                  {new Date(tx.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tx.amount > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className="text-[11px] font-black uppercase tracking-tighter text-[var(--color-text-primary)]">
                                      {tx.type.replace('_', ' ')}
                                    </span>
                                  </div>
                                </td>
                                <td className={`px-6 py-5 text-right font-black tabular-nums ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-12 text-center text-[var(--color-text-secondary)] italic text-sm">
                                No transitions recorded in the credit ledger.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>

      {showQrModal && profileShareUrl && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowQrModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-5 text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-serif font-bold">Profile QR</h3>
              <button onClick={() => setShowQrModal(false)}><X size={16} /></button>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(profileShareUrl)}`}
              alt="Profile QR Code"
              className="w-44 h-44 mx-auto rounded-lg border border-[var(--color-border)]"
            />
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(profileShareUrl)
                  notify.success('Profile link copied to clipboard!')
                }}
                className="w-full py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy size={12} /> Copy Profile Link
              </button>
            </div>
          </div>
        </div>
      )}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
      />
      <ShareCreditsModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSuccess={() => {
          refreshUser()
        }}
      />
      <BottomNav />
    </div>
  )
}
