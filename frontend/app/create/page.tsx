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
  Send
} from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import Header from '@/components/Header'
import { storageService } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Badge from '@/components/Badge'
import Button from '@/components/Button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const CATEGORIES = ['Design', 'Development', 'Marketing', 'Data', 'Other']

function CreateIntentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const { token, user, isAuthenticated, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Design',
    location: '',
    timeline: '',
    budget: '',
    goal: '',
  })

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

      const payload = {
        ...formData,
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

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-10 gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-64 hidden lg:flex flex-col gap-6 sticky top-24 h-fit">
          <div className="p-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-3xl space-y-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Navigate</p>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] rounded-xl transition-all"
                >
                  <item.icon size={16} />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Unified Project Form */}
        <main className="flex-1 max-w-3xl">
          
          <div className="mb-10 space-y-4">
            <Badge variant="accent" className="uppercase tracking-[0.3em]">Project Creation</Badge>
            <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight">
              {editId ? 'Refine your project.' : 'Post your vision.'}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-medium">Simple. Direct. Collaborative. List your project in seconds.</p>
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 md:p-12 shadow-sm">
            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center space-y-8"
                >
                   <div className="w-20 h-20 rounded-3xl bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)]">
                      <CheckCircle size={40} />
                   </div>
                   <div className="space-y-4">
                     <h3 className="text-3xl font-serif font-black">Success!</h3>
                     <p className="text-sm text-[var(--color-text-secondary)]">Your project is now live on the marketplace.</p>
                   </div>
                </motion.div>
              ) : isInitialLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                   <Loader2 className="animate-spin text-[var(--color-accent)]" size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Loading details...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-12">
                  
                  {/* --- SECTION 1: CORE DETAILS --- */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                       <FileText size={18} className="text-[var(--color-accent)]" />
                       <h2 className="text-lg font-serif font-bold italic">Core Vision</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Project Title</label>
                         <input 
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Building an AI Skill Marketplace"
                            className="w-full text-2xl font-serif font-bold p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none transition-all"
                         />
                         {errors.title && <p className="text-[10px] font-bold text-red-500">{errors.title}</p>}
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Description & Context</label>
                         <textarea 
                            name="description"
                            rows={5}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your vision and who you're looking for..."
                            className="w-full text-base font-medium p-6 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none transition-all resize-none leading-relaxed"
                         />
                         {errors.description && <p className="text-[10px] font-bold text-red-500">{errors.description}</p>}
                      </div>
                    </div>
                  </div>

                  {/* --- SECTION 2: ARCHETYPE --- */}
                  <div className="space-y-6">
                     <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] block">Category</label>
                     <div className="flex flex-wrap gap-3">
                        {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                            className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                              formData.category === cat 
                              ? 'bg-[var(--color-accent)] text-white shadow-md' 
                              : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                     </div>
                  </div>

                  {/* --- SECTION 3: LOGISTICS --- */}
                  <div className="p-8 bg-[var(--color-bg-primary)] rounded-3xl border border-[var(--color-border)] space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2">
                             <MapPin size={14} className="text-[var(--color-accent)]" /> Location
                           </label>
                           <input 
                              name="location"
                              value={formData.location}
                              onChange={handleChange}
                              placeholder="Remote or Specific City"
                              className="w-full text-lg font-bold p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none transition-all"
                           />
                           {errors.location && <p className="text-[10px] font-bold text-red-500">{errors.location}</p>}
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2">
                             <Clock size={14} className="text-[var(--color-accent)]" /> Target Deadline
                           </label>
                           <input 
                             type="datetime-local"
                             name="timeline"
                             value={formData.timeline}
                             onChange={handleChange}
                             className="w-full text-sm font-bold p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none cursor-pointer appearance-none"
                           />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2">
                          <DollarSign size={14} className="text-[var(--color-accent)]" /> Budget / Exchange
                        </label>
                        <input 
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="e.g. $500 - $1000 or 'Skill Exchange'"
                          className="w-full text-lg font-bold p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none transition-all"
                        />
                     </div>
                  </div>

                  {/* --- SECTION 4: FINAL OBJECTIVE --- */}
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2">
                          <Target size={14} className="text-[var(--color-accent)]" /> Ultimate Objective
                        </label>
                        <input 
                           name="goal"
                           value={formData.goal}
                           onChange={handleChange}
                           placeholder="What defines success for this project?"
                           className="w-full text-lg font-bold p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none transition-all"
                        />
                     </div>

                     <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-2">
                          <FileUp size={14} className="text-[var(--color-accent)]" /> Attachment (optional)
                        </label>
                        
                        {!uploadedFile ? (
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-3xl p-10 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]/20 transition-all cursor-pointer bg-[var(--color-bg-primary)] group">
                             <Plus size={24} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] mb-2" />
                             <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Attach Vision Artifact</p>
                             <input type="file" onChange={handleFileUpload} className="hidden" />
                          </label>
                        ) : (
                          <div className="p-6 bg-[var(--color-accent-soft)]/20 border border-[var(--color-accent)]/20 rounded-2xl flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <CheckCircle size={20} className="text-[var(--color-accent)]" />
                                <span className="text-sm font-bold truncate max-w-[200px]">{uploadedFile.name}</span>
                             </div>
                             <button type="button" onClick={() => setUploadedFile(null)} className="text-[9px] font-black uppercase text-red-500 hover:underline">Remove</button>
                          </div>
                        )}
                        {fileError && <p className="text-[10px] font-bold text-red-500">{fileError}</p>}
                     </div>

                     {submitError && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                           <AlertCircle size={18} />
                           <p className="text-sm font-medium">{submitError}</p>
                        </div>
                     )}
                  </div>

                  {/* Submission Controls */}
                  <div className="flex items-center justify-between pt-10 border-t border-[var(--color-border)]">
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
                       className="px-12 py-5 rounded-2xl flex items-center gap-3 bg-[var(--color-accent)] shadow-xl shadow-[var(--color-accent)]/20"
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
