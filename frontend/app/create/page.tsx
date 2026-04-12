'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Loader2, Sparkles, Send, Calendar, MapPin, DollarSign, Target, FileUp, ChevronRight, ChevronLeft, LayoutDashboard, FileText, MessageSquare, Users, ChevronDown, PenTool, Globe, Zap } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'
import Avatar from '@/components/Avatar'
import Header from '@/components/Header'
import { storageService } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const CATEGORIES = ['Design', 'Development', 'Marketing', 'Data', 'Other']

function CreateIntentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const { token, user, isAuthenticated, loading: authLoading, logout } = useAuth()
  const { theme } = useTheme()
  
  const [currentStep, setCurrentStep] = useState(1)
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
            setSubmitError('Failed to load intent for editing')
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

  // Auth Protection Fallback
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Field Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

    if (!allowedTypes.includes(file.type)) {
      setFileError('Only images (JPG, PNG, WebP) and PDFs are allowed')
      setUploadedFile(null)
      return
    }

    if (file.size > maxSize) {
      setFileError('File size must be less than 5MB')
      setUploadedFile(null)
      return
    }

    setFileError(null)
    setUploadedFile(file)
  }

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'A title is required for your vision.'
      if (!formData.description.trim()) newErrors.description = 'Please provide context for your collective.'
    } else if (step === 2) {
      if (!formData.location.trim()) newErrors.location = 'A location helps with proximity matching.'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(3)) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      let attachmentPath = ''
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const storagePath = `intents/${fileName}`
        
        const uploadedPath = await storageService.uploadFile(uploadedFile, storagePath)
        if (uploadedPath) {
          attachmentPath = uploadedPath
        }
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
        throw new Error(data.error || 'Failed to process intent')
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
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col font-sans transition-colors duration-700">
      
      <Header />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-12 gap-12">
        
        {/* ─── SIDEBAR ─── */}
        <aside className="w-80 border border-[var(--color-border)] hidden lg:flex flex-col p-10 rounded-[3rem] sticky top-32 h-[calc(100vh-160px)] bg-[var(--color-bg-secondary)] shadow-2xl shadow-[var(--color-accent)]/5">
          <nav className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] mb-10 ml-2">Digital Core</p>
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-4 px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-soft)] rounded-[1.5rem] transition-all group"
              >
                <item.icon size={18} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                {item.label}
              </a>
            ))}
          </nav>
          
          <div className="mt-auto pt-10 border-t border-[var(--color-border)]">
             <div className="p-8 rounded-[2rem] bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                <p className="text-[9px] font-black text-[var(--color-accent)] tracking-[0.2em] leading-relaxed uppercase">Collaborate. <br />Iterate. <br />Elevate.</p>
             </div>
          </div>
        </aside>

        {/* ─── MAIN CREATION STUDIO ─── */}
        <main className="flex-1 space-y-16">
          
          {/* Header Area */}
          <div className="space-y-8 border-b border-[var(--color-border)] pb-12">
            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-accent)]">Broadcast Studio</span>
            <h2 className="text-6xl md:text-8xl font-serif font-black leading-none italic tracking-tighter text-[var(--color-text-primary)]">
              {editId ? 'Refining.' : 'Drafting.'}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mt-4">Transmuting thoughts into professional mandates</p>
          </div>

          {/* Progress Architecture */}
          <div className="grid grid-cols-3 gap-8">
             {[1, 2, 3].map((step) => (
               <div key={step} className={`space-y-4 transition-all duration-1000 ${currentStep >= step ? 'opacity-100' : 'opacity-20'}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)]">Phase 0{step}</p>
                    {currentStep > step && <CheckCircle size={12} className="text-[var(--color-accent)]" />}
                  </div>
                  <div className="relative h-[2px] w-full bg-[var(--color-border)] overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full bg-[var(--color-accent)] transition-all duration-1000 ease-out ${currentStep >= step ? 'w-full' : 'w-0'}`} />
                  </div>
                  <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
                     {step === 1 ? 'Concept' : step === 2 ? 'Context' : 'Finalize'}
                  </p>
               </div>
             ))}
          </div>

          <div className="min-h-[500px]">
            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-12 animate-fade-in rounded-[4rem] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-2xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]" />
                 <div className="w-32 h-32 rounded-full border border-[var(--color-accent)] flex items-center justify-center bg-[var(--color-bg-primary)]">
                    <Zap size={48} className="text-[var(--color-accent)] fill-[var(--color-accent)]" />
                 </div>
                 <div className="space-y-4">
                   <h3 className="text-5xl font-serif italic text-[var(--color-text-primary)]">Manifestation Complete.</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-accent)]">Your intent is now part of the collective.</p>
                 </div>
              </div>
            ) : isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-8 animate-pulse">
                 <Loader2 className="animate-spin text-[var(--color-accent)]" size={64} strokeWidth={1} />
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)]">Retrieving encrypted vision...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-20">
                
                {/* STEP 1: CONCEPT & CATEGORY */}
                {currentStep === 1 && (
                  <div className="space-y-16 animate-fade-in">
                      <div className="space-y-8">
                         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">
                           <PenTool size={16} className="text-[var(--color-accent)]" />
                           Mandate Title
                         </div>
                         <input 
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Identify the vision..."
                            className="w-full text-4xl md:text-6xl font-serif font-black border-b border-[var(--color-border)] focus:border-[var(--color-accent)] bg-transparent pb-8 outline-none transition-all placeholder:text-[var(--color-text-secondary)]/10 tracking-tighter"
                         />
                         {errors.title && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pt-2">{errors.title}</p>}
                      </div>

                      <div className="space-y-8">
                         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">
                           <FileText size={16} className="text-[var(--color-accent)]" />
                           Draft Narrative
                         </div>
                         <textarea 
                            name="description"
                            rows={6}
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Deconstruct the nuances of your collaborative request..."
                            className="w-full text-2xl md:text-3xl font-serif italic border-b border-[var(--color-border)] focus:border-[var(--color-accent)] bg-transparent pb-8 outline-none transition-all placeholder:text-[var(--color-text-secondary)]/10 resize-none leading-relaxed"
                         />
                         {errors.description && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pt-2">{errors.description}</p>}
                      </div>

                      <div className="space-y-10">
                         <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-4">
                           <Target size={16} className="text-[var(--color-accent)]" />
                           Archetype Selection
                         </div>
                         <div className="flex flex-wrap gap-4">
                            {CATEGORIES.map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                className={`px-12 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden ${
                                  formData.category === cat 
                                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-2xl scale-105' 
                                  : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                         </div>
                      </div>
                  </div>
                )}

                {/* STEP 2: LOGISTICS & CONTEXT */}
                {currentStep === 2 && (
                  <div className="space-y-16 animate-fade-in">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                        <div className="space-y-8">
                           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">
                             <Globe size={16} className="text-[var(--color-accent)]" />
                             Geography
                           </div>
                           <div className="flex items-center border-b border-[var(--color-border)] focus-within:border-[var(--color-accent)] py-8 transition-all">
                              <MapPin size={24} className="text-[var(--color-accent)] opacity-40 mr-8" />
                              <input 
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Physical vs Remote Node..."
                                className="w-full text-3xl font-serif font-black bg-transparent outline-none placeholder:text-[var(--color-text-secondary)]/10"
                              />
                           </div>
                           {errors.location && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pt-2">{errors.location}</p>}
                        </div>
                        <div className="space-y-8">
                           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">
                             <Calendar size={16} className="text-[var(--color-accent)]" />
                             Timeline Proposal
                           </div>
                           <div className="flex items-center border-b border-[var(--color-border)] focus-within:border-[var(--color-accent)] py-8 transition-all relative">
                              <input 
                                type="datetime-local"
                                name="timeline"
                                value={formData.timeline}
                                onChange={handleChange}
                                className="w-full text-3xl font-serif font-black bg-transparent outline-none cursor-pointer appearance-none text-[var(--color-text-primary)]"
                              />
                              <div className="absolute right-0 pointer-events-none text-[var(--color-accent)] opacity-40">
                                 <Plus size={20} />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8 pt-12">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">
                          <DollarSign size={16} className="text-[var(--color-accent)]" />
                          Economic Scope
                        </div>
                        <div className="flex items-center border-b border-[var(--color-border)] focus-within:border-[var(--color-accent)] py-8 transition-all">
                           <DollarSign size={32} className="text-[var(--color-accent)] opacity-40 mr-8" />
                           <input 
                             name="budget"
                             value={formData.budget}
                             onChange={handleChange}
                             placeholder="Define the exchange parameters..."
                             className="w-full text-4xl font-serif font-black bg-transparent outline-none placeholder:text-[var(--color-text-secondary)]/10"
                           />
                        </div>
                     </div>
                  </div>
                )}

                {/* STEP 3: FINALIZATION & MEDIA */}
                {currentStep === 3 && (
                  <div className="space-y-16 animate-fade-in">
                     <div className="space-y-8">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">
                          <Target size={16} className="text-[var(--color-accent)]" />
                          Ultimate Objective
                        </div>
                        <textarea 
                           name="goal"
                           rows={4}
                           value={formData.goal}
                           onChange={handleChange}
                           placeholder="What defines success for this collective engagement?"
                           className="w-full text-4xl font-serif font-black italic border-b border-[var(--color-border)] focus:border-[var(--color-accent)] bg-transparent pb-8 outline-none transition-all placeholder:text-[var(--color-text-secondary)]/10 resize-none leading-tight"
                        />
                     </div>

                     <div className="space-y-10">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-6">
                          <FileUp size={16} className="text-[var(--color-accent)]" />
                          Visual Evidence
                        </div>
                        {!uploadedFile ? (
                          <label className="group flex flex-col items-center justify-center border border-[var(--color-border)] rounded-[4rem] p-32 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] transition-all cursor-pointer bg-[var(--color-bg-secondary)] shadow-inner">
                             <div className="w-24 h-24 bg-[var(--color-bg-primary)] rounded-[2.5rem] flex items-center justify-center border border-[var(--color-border)] mb-10 group-hover:scale-110 group-hover:border-[var(--color-accent)] transition-all">
                                <FileUp size={40} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-accent)] transition-colors" />
                             </div>
                             <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">Ingest Artifact</p>
                             <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40 mt-4">Images or PDF up to 5MB</p>
                             <input type="file" onChange={handleFileUpload} className="hidden" />
                          </label>
                        ) : (
                          <div className="p-12 border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]/20 rounded-[3rem] flex items-center justify-between shadow-xl animate-scale-in">
                             <div className="flex items-center gap-10">
                                <div className="w-24 h-24 rounded-[2rem] bg-[var(--color-bg-primary)] flex items-center justify-center border border-[var(--color-accent)]/20 text-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/10">
                                   <Sparkles size={32} />
                                </div>
                                <div className="space-y-2">
                                   <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)]">{uploadedFile.name}</p>
                                   <p className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest opacity-70 italic">Synchronized and verified</p>
                                </div>
                             </div>
                             <button onClick={() => setUploadedFile(null)} className="px-10 py-5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500 hover:text-white transition-all">Purge</button>
                          </div>
                        )}
                        {fileError && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest pt-2">{fileError}</p>}
                     </div>

                     {submitError && (
                        <div className="p-10 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] flex items-center gap-6 text-red-500 animate-shake">
                           <AlertCircle size={24} />
                           <p className="text-base font-serif italic">{submitError}</p>
                        </div>
                     )}
                  </div>
                )}

                {/* EDITORIAL NAVIGATION CONTROLS */}
                <div className="flex items-center justify-between pt-20 border-t border-[var(--color-border)]">
                   <button
                      type="button"
                      onClick={currentStep === 1 ? () => router.push('/dashboard') : prevStep}
                      className="text-[11px] font-black uppercase tracking-[0.6em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all flex items-center gap-4 group"
                   >
                     <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
                     {currentStep === 1 ? 'Abort Session' : 'Prior Phase'}
                   </button>

                   <div className="flex items-center gap-8">
                     {currentStep < 3 ? (
                       <button
                          type="button"
                          onClick={nextStep}
                          className="px-16 py-7 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[11px] font-black uppercase tracking-[0.6em] transition-all flex items-center gap-6 hover:bg-[var(--color-accent)] shadow-2xl shadow-[var(--color-text-primary)]/10 rounded-full group"
                       >
                          Advance <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                       </button>
                     ) : (
                       <button
                         type="submit"
                         disabled={isSubmitting}
                         className="px-16 py-7 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[11px] font-black uppercase tracking-[0.6em] transition-all hover:bg-[var(--color-text-primary)] shadow-2xl shadow-[var(--color-accent)]/20 flex items-center gap-6 rounded-full group"
                       >
                         {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                           <>
                             Initialize Mandate <Send size={18} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                           </>
                         )}
                       </button>
                     )}
                   </div>
                </div>
              </form>
            )}
          </div>

        </main>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(40px); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-fade-in { animation: fade-in 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-scale-in { animation: scale-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-shake { animation: shake 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </div>
  )
}

export default function CreateIntentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center space-y-12">
         <div className="w-32 h-32 rounded-full border border-[var(--color-accent)] animate-spin border-t-transparent" />
         <p className="font-serif italic text-[var(--color-accent)] text-4xl animate-pulse tracking-tighter">Synchronizing with the collective consciousness...</p>
      </div>
    }>
       <CreateIntentContent />
    </Suspense>
  )
}

