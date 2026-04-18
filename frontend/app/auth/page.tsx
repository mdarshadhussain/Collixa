'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Input from '@/components/Input'
import { useAuth } from '@/app/context/AuthContext'
import LegalModal from '@/components/LegalModal'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register, loginWithGoogle, loginWithFacebook } = useAuth()
  
  const mode = searchParams.get('mode')
  const [isLogin, setIsLogin] = useState(mode !== 'register')
  
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false)
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({})

  useEffect(() => {
    if (mode === 'register') {
      setIsLogin(false)
      setIsLegalModalOpen(true)
    }
    else if (mode === 'login') setIsLogin(true)
  }, [mode])

  const handleModeToggle = (loginMode: boolean) => {
    setIsLogin(loginMode)
    setApiError('')
    setErrors({})
    if (!loginMode) {
      setIsLegalModalOpen(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (apiError) setApiError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLogin && !isPolicyAccepted) return
    setApiError('')
    
    const newErrors: any = {}
    const normalizedEmail = formData.email.toLowerCase().trim()
    if (!formData.email) newErrors.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(normalizedEmail)) newErrors.email = 'Invalid format'
    
    if (!formData.password) newErrors.password = 'Password required'
    else if (formData.password.length < 8) newErrors.password = '8+ chars needed'
    
    if (!isLogin) {
      if (!formData.name) newErrors.name = 'Name required'
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mismatch'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        const result = await login(normalizedEmail, formData.password)
        if (result.error) setApiError(result.error)
        else router.push('/dashboard')
      } else {
        const result = await register(normalizedEmail, formData.password, formData.name)
        if (result.error) setApiError(result.error)
        else if (result.pendingVerification) {
          const otpParam = result.otp ? `&otp=${result.otp}` : ''
          router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}${otpParam}`)
        }
      }
    } catch (err) {
      setApiError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex font-sans overflow-hidden bg-[#F5F5F0]">
      <LegalModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        onAccept={() => setIsPolicyAccepted(true)}
      />

      {/* ─── LEFT BRAND PANEL (DESKTOP) ─── */}
      <div className="hidden lg:flex lg:w-[40%] bg-[#021A54] relative overflow-hidden flex-col justify-between p-12 xl:p-16 h-full">
        {/* Dynamic Accent */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF85BB] rounded-full blur-[160px] opacity-20" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-[#FF85BB] rounded-full blur-[120px] opacity-10" />

        <div 
          className="relative z-10 flex items-center gap-4 cursor-pointer group"
          onClick={() => router.push('/')}
        >
          <h1 className="text-4xl font-serif font-black tracking-tighter text-white">Collixa.</h1>
        </div>

        <div className="relative z-10">
          <h2 className="text-[48px] xl:text-[56px] leading-[0.95] font-serif font-black text-white italic mb-6 tracking-tighter">
            Build the future <br /> with intent.
          </h2>
          <p className="text-[#F5F5F0]/60 text-base xl:text-lg max-w-sm leading-relaxed font-sans font-medium">
            Join a community of high-impact collaborators and turn your grand visions into documented reality.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF85BB]/40 italic">Collixa Infrastructure</p>
        </div>
      </div>

      {/* ─── RIGHT INTERACTIVE PANEL ─── */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 md:p-12 h-screen overflow-hidden">
        <div className="w-full max-w-md">
          {/* Mobile Logo Only */}
          <div 
             className="lg:hidden flex items-center justify-center gap-3 mb-8 cursor-pointer"
             onClick={() => router.push('/')}
          >
            <h1 className="text-2xl font-serif font-black tracking-tighter text-[#021A54]">Collixa.</h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-left mb-8">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF85BB] mb-2 block">Secure Access</span>
               <h2 className="text-3xl xl:text-4xl font-serif font-black text-[#021A54] tracking-tight">
                 {isLogin ? 'Welcome back.' : 'Join the intent.'}
               </h2>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2 mb-8 bg-[var(--color-bg-secondary)] p-1.5 rounded-2xl border border-[#EBEBEB] shadow-sm">
              <button
                onClick={() => handleModeToggle(true)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isLogin ? 'bg-[#021A54] text-white shadow-xl' : 'text-[#4A5568] hover:text-[#021A54]'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => handleModeToggle(false)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  !isLogin ? 'bg-[#021A54] text-white shadow-xl' : 'text-[#4A5568] hover:text-[#021A54]'
                }`}
              >
                Register
              </button>
            </div>

            {apiError && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4 text-red-500"
               >
                  <ShieldCheck size={18} />
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{apiError}</p>
               </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-1.5"
                >
                   <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#4A5568] ml-1">Full Name</label>
                   <Input
                    name="name"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    icon={<User size={16} className="opacity-30" />}
                    className="w-full px-6 py-3.5 bg-[var(--color-bg-secondary)] border border-[#EBEBEB] rounded-full text-xs font-semibold focus:border-[#FF85BB] focus:ring-1 focus:ring-[#FF85BB]/20 outline-none transition-all"
                   />
                </motion.div>
              )}

               <div className="flex flex-col sm:flex-row gap-4">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex-1 space-y-1.5"
                  >
                     <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#4A5568] ml-1">Email Address</label>
                     <Input
                      name="email"
                      type="email"
                      placeholder="email@work.com"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      icon={<Mail size={16} className="opacity-30" />}
                      className="w-full px-6 py-3.5 bg-[var(--color-bg-secondary)] border border-[#EBEBEB] rounded-full text-xs font-semibold focus:border-[#FF85BB] focus:ring-1 focus:ring-[#FF85BB]/20 outline-none transition-all"
                     />
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1 space-y-1.5"
                  >
                     <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#4A5568] ml-1">Password</label>
                     <Input
                      name="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      icon={<Lock size={16} className="opacity-30" />}
                      className="w-full px-6 py-3.5 bg-[var(--color-bg-secondary)] border border-[#EBEBEB] rounded-full text-xs font-semibold focus:border-[#FF85BB] focus:ring-1 focus:ring-[#FF85BB]/20 outline-none transition-all"
                     />
                  </motion.div>
               </div>

               {!isLogin && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.3 }}
                   className="space-y-1.5"
                 >
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#4A5568] ml-1">Confirm Password</label>
                    <Input
                     name="confirmPassword"
                     type="password"
                     placeholder="Confirm password"
                     value={formData.confirmPassword}
                     onChange={handleChange}
                     error={errors.confirmPassword}
                     icon={<Lock size={16} className="opacity-30" />}
                     className="w-full px-6 py-3.5 bg-[var(--color-bg-secondary)] border border-[#EBEBEB] rounded-full text-xs font-semibold focus:border-[#FF85BB] focus:ring-1 focus:ring-[#FF85BB]/20 outline-none transition-all"
                    />
                 </motion.div>
               )}

              {!isLogin && (
                <div className="pt-2 flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="policy" 
                    checked={isPolicyAccepted}
                    onChange={(e) => setIsPolicyAccepted(e.target.checked)}
                    className="w-4 h-4 accent-[#FF85BB] rounded border-[#EBEBEB] cursor-pointer"
                  />
                  <label htmlFor="policy" className="text-[11px] font-medium tracking-tight text-[#021A54]/70 cursor-pointer">
                    I accept the <button type="button" onClick={() => setIsLegalModalOpen(true)} className="text-[#FF85BB] border-b border-[#FF85BB]/30 font-bold">Privacy Policy</button>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!isLogin && !isPolicyAccepted)}
                className={`w-full mt-6 py-3 bg-[#021A54] text-white text-[12px] font-bold uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 flex items-center justify-center gap-4 group shadow-xl shadow-[#021A54]/10 ${
                  ((!isLogin && !isPolicyAccepted) || loading) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-[#FF85BB] hover:scale-[1.02]'
                }`}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Join Collixa'}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Social Logins */}
            <div className="mt-8">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#EBEBEB]"></div>
                </div>
                <span className="relative px-4 bg-[#F5F5F0] text-[9px] font-black uppercase tracking-[0.3em] text-[#4A5568]/40">Social Archive</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const { error } = await loginWithGoogle()
                    if (error) setApiError(error)
                  }}
                  className="flex items-center justify-center gap-3 py-3 bg-[var(--color-bg-secondary)] border border-[#EBEBEB] rounded-2xl hover:border-[#FF85BB] hover:shadow-xl hover:shadow-[#FF85BB]/5 transition-all group active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-[#021A54]" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#021A54]">
                    {loading ? 'Archiving...' : 'Google'}
                  </span>
                </button>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const { error } = await loginWithFacebook()
                    if (error) setApiError(error)
                  }}
                  className="flex items-center justify-center gap-3 py-3 bg-[var(--color-bg-secondary)] border border-[#EBEBEB] rounded-2xl hover:border-[#FF85BB] hover:shadow-xl hover:shadow-[#FF85BB]/5 transition-all group active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin text-[#1877F2]" />
                  ) : (
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.248h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#021A54]">
                    {loading ? 'Authenticating...' : 'Facebook'}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-between px-2">
               <button onClick={() => router.push('/forgot-password')} className="text-[9px] font-black uppercase tracking-widest text-[#4A5568] hover:text-[#FF85BB] transition-colors">
                 Lost access?
               </button>
               <p className="text-[8px] font-bold text-[#4A5568] uppercase tracking-tighter opacity-30">Infrastructure Active</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-serif italic text-2xl text-[#FF85BB]">Establishing link...</div>}>
      <AuthContent />
    </Suspense>
  )
}
