'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  MapPin,
  Clock,
  DollarSign,
  Target,
  FileUp,
  Send,
  FolderKanban,
  BookOpen,
  Dumbbell,
  Plane,
  CalendarDays,
  Rocket,
  Network,
  Lightbulb,
  UsersRound,
  Layers,
  Calendar
} from 'lucide-react'
import CustomDatePicker from '@/components/CustomDatePicker'
import { useAuth } from '@/app/context/AuthContext'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { storageService } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '@/components/Badge'
import Button from '@/components/Button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const CATEGORIES = [
  { name: 'Projects', icon: FolderKanban },
  { name: 'Study', icon: BookOpen },
  { name: 'Fitness', icon: Dumbbell },
  { name: 'Travel', icon: Plane },
  { name: 'Events', icon: CalendarDays },
  { name: 'Startup', icon: Rocket },
  { name: 'Networking', icon: Network },
  { name: 'Creative', icon: Lightbulb },
  { name: 'Social', icon: UsersRound },
  { name: 'Other', icon: Layers }
]

function CreateIntentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const { token, user, isAuthenticated, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Design',
    customCategory: '',
    location: '',
    timeline: '',
    budget: '',
    goal: '',
  })

  const getCategoryIcon = (name: string) => {
    const cat = CATEGORIES.find(c => c.name === name)
    return cat?.icon || Layers
  }

  // State Management
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(!!editId)

  // Fetch intent data if in edit mode
  useEffect(() => {
    if (editId && token) {
      const fetchIntent = async () => {
        try {
          const response = await fetch(`${API_URL}/api/intents/${editId}`)
          const data = await response.json()
          if (response.ok && data.data) {
            const intent = data.data
            setFormData({
              title: intent.title || '',
              description: intent.description || '',
              category: intent.category || 'Design',
              customCategory: '',
              location: intent.location || '',
              timeline: intent.timeline ? new Date(intent.timeline).toISOString().slice(0, 16) : '',
              budget: intent.budget || '',
              goal: intent.goal || '',
            })
          } else {
            setSubmitError('Failed to load project for editing')
          }
        } catch (err) {
          setSubmitError('Error connecting to server')
        } finally {
          setIsInitialLoading(false)
        }
      }
      fetchIntent()
    }
  }, [editId, token])

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

    if (!allowedTypes.includes(file.type)) {
      setFileError('Allowing only images (JPG, PNG, WebP) and PDFs.')
      setUploadedFile(null)
      return
    }
    if (file.size > maxSize) {
      setFileError('File size must be under 5MB.')
      setUploadedFile(null)
      return
    }
    setFileError(null)
    setUploadedFile(file)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required.'
    if (!formData.description.trim()) newErrors.description = 'Description is required.'
    if (!formData.location.trim()) newErrors.location = 'Location is required.'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
       // Scroll to top of list if errors exist
       window.scrollTo({ top: 0, behavior: 'smooth' })
       return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      let attachmentPath = ''
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const storagePath = `intents/${fileName}`
        const uploadedPath = await storageService.uploadFile(uploadedFile, storagePath)
        if (uploadedPath) attachmentPath = uploadedPath
      }

      const { customCategory, ...restFormData } = formData
      const payload = {
        ...restFormData,
        category: formData.category === 'Other' && formData.customCategory
          ? formData.customCategory
          : formData.category,
        timeline: formData.timeline ? new Date(formData.timeline).toISOString() : new Date().toISOString(),
        status: 'looking',
        created_by: user?.id || '',
        ...(attachmentPath && { attachment_name: attachmentPath })
      }

      const response = await fetch(editId ? `${API_URL}/api/intents/${editId}` : `${API_URL}/api/intents`, {
        method: editId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to post project')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        router.push(editId ? '/my-intents' : '/dashboard')
      }, 2000)

    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Marketplace', href: '/dashboard' },
    { icon: FileText, label: 'My Intents', href: '/my-intents' },
    { icon: MessageSquare, label: 'Messages', href: '/chat' },
    { icon: Users, label: 'Community', href: '/skills' },
  ]

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col font-sans">
      <Header />

      <div className="flex flex-1 max-w-[1600px] mx-auto w-full px-3 sm:px-4 md:px-8 py-5 md:py-8 gap-4 md:gap-8">
        <Sidebar />
        
        {/* Unified Project Form */}
        <main className="flex-1 max-w-4xl">
          
          <div className="mb-6 md:mb-8 space-y-3 md:space-y-4 bg-[var(--color-bg-secondary)]/70 border border-[var(--color-border)] rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-8">
            <Badge variant="accent" className="uppercase tracking-[0.3em]">Project Creation</Badge>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-serif font-black tracking-tight">
              {editId ? 'Refine your project.' : 'Post your vision.'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium">Simple. Direct. Collaborative. List your project in seconds.</p>
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl md:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-sm">
            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-5 md:space-y-8"
                >
                   <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)]">
                      <CheckCircle size={28} className="md:w-10 md:h-10" />
                   </div>
                   <div className="space-y-4">
                     <h3 className="text-2xl md:text-3xl font-serif font-black">Success!</h3>
                     <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Your project is now live on the marketplace.</p>
                   </div>
                </motion.div>
              ) : isInitialLoading ? (
                <div className="flex flex-col items-center justify-center py-16 md:py-32 space-y-5 md:space-y-6">
                   <Loader2 className="animate-spin text-[var(--color-accent)]" size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Loading details...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-7 md:space-y-10">
                  
                  {/* --- UNIFIED FORM SECTION --- */}
                  <div className="space-y-8">
                    {/* Project Title */}
                    <div className="space-y-3">
                      <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                        <FileText size={18} className="text-[var(--color-accent)]" /> Project Title
                      </label>
                      <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Building an AI Skill Marketplace"
                        className="editorial-input !font-serif !font-medium"
                      />
                      {errors.title && <p className="text-[10px] font-bold text-red-500">{errors.title}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                      <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                        <FileText size={16} className="text-[var(--color-accent)]" /> Description & Context
                      </label>
                      <textarea
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe your vision and who you're looking for..."
                        className="editorial-textarea"
                      />
                      {errors.description && <p className="text-[10px] font-bold text-red-500">{errors.description}</p>}
                    </div>

                    {/* Category */}
                    <div className="space-y-3">
                      <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                        <Layers size={16} className="text-[var(--color-accent)]" /> Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => {
                          const Icon = cat.icon
                          return (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
                                formData.category === cat.name
                                ? 'bg-[var(--color-accent)] text-white shadow-md'
                                : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                              }`}
                            >
                              <Icon size={14} />
                              {cat.name}
                            </button>
                          )
                        })}
                      </div>
                      {formData.category === 'Other' && (
                        <div className="pt-2">
                          <input
                            name="customCategory"
                            value={formData.customCategory}
                            onChange={handleChange}
                            placeholder="Please specify your category..."
                            className="editorial-input !font-serif !font-medium"
                          />
                        </div>
                      )}
                    </div>

                    {/* Location & Deadline Row */}
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                          <MapPin size={16} className="text-[var(--color-accent)]" /> Location
                        </label>
                        <input
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Remote or Specific City"
                          className="editorial-input"
                        />
                        {errors.location && <p className="text-[10px] font-bold text-red-500">{errors.location}</p>}
                      </div>
                      <div className="space-y-3">
                        <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                          <Clock size={16} className="text-[var(--color-accent)]" /> Target Deadline
                        </label>
                        <CustomDatePicker
                          selected={formData.timeline ? new Date(formData.timeline) : null}
                          onChange={(date) => setFormData(prev => ({ ...prev, timeline: date ? date.toISOString() : '' }))}
                          placeholderText="Select deadline..."
                        />
                      </div>
                    </div>

                    {/* Budget & Attachment Row */}
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                          <DollarSign size={16} className="text-[var(--color-accent)]" /> Budget / Exchange
                        </label>
                        <input
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="e.g. $500 - $1000 or 'Skill Exchange'"
                          className="editorial-input"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                          <FileUp size={16} className="text-[var(--color-accent)]" /> Attachment
                        </label>
                        {!uploadedFile ? (
                          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border)] rounded-full px-4 py-3 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/20 transition-all cursor-pointer bg-[var(--color-bg-primary)] group">
                            <Plus size={18} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)]" />
                            <span className="text-xs font-medium text-[var(--color-text-secondary)]">Add File</span>
                            <input type="file" onChange={handleFileUpload} className="hidden" />
                          </label>
                        ) : (
                          <div className="px-4 py-3 bg-[var(--color-accent-soft)]/20 border border-[var(--color-accent)]/20 rounded-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircle size={16} className="text-[var(--color-accent)]" />
                              <span className="text-xs font-medium truncate max-w-[150px]">{uploadedFile.name}</span>
                            </div>
                            <button type="button" onClick={() => setUploadedFile(null)} className="text-[9px] font-black uppercase text-red-500 hover:underline">Remove</button>
                          </div>
                        )}
                        {fileError && <p className="text-[10px] font-bold text-red-500">{fileError}</p>}
                      </div>
                    </div>

                    {/* Ultimate Objective */}
                    <div className="space-y-3">
                      <label className="text-base md:text-lg font-serif font-bold italic text-[var(--color-text-primary)] flex items-center gap-2">
                        <Target size={16} className="text-[var(--color-accent)]" /> Ultimate Objective
                      </label>
                      <input
                        name="goal"
                        value={formData.goal}
                        onChange={handleChange}
                        placeholder="What defines success for this project?"
                        className="editorial-input"
                      />
                    </div>

                    {submitError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                        <AlertCircle size={18} />
                        <p className="text-sm font-medium">{submitError}</p>
                      </div>
                    )}
                  </div>

                  {/* Submission Controls */}
                  <div className="flex items-center justify-between pt-6 md:pt-8 border-t border-[var(--color-border)]">
                     <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all flex items-center gap-2"
                     >
                       <ArrowLeft size={14} /> Cancel
                     </button>

                     <Button
                       type="submit"
                       disabled={isSubmitting}
                      className="px-5 sm:px-8 md:px-12 py-3.5 sm:py-4 md:py-5 rounded-xl md:rounded-2xl flex items-center gap-2 sm:gap-3 bg-[var(--color-accent)] shadow-xl shadow-[var(--color-accent)]/20 text-[10px] sm:text-xs md:text-sm"
                     >
                       {isSubmitting ? (
                         <>
                           <Loader2 className="animate-spin" size={18} /> Processing...
                         </>
                       ) : (
                         <>
                           {editId ? 'Save Changes' : 'Post Project'} <Send size={18} />
                         </>
                       )}
                     </Button>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CreateIntentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
         <Loader2 className="animate-spin text-[var(--color-accent)]" size={48} />
      </div>
    }>
       <CreateIntentContent />
    </Suspense>
  )
}
