'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react'
import Input from '@/components/Input'
import { useAuth } from '@/app/context/AuthContext'
import { useTheme } from '@/app/context/ThemeContext'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register } = useAuth()
  const { theme } = useTheme()
  
  const mode = searchParams.get('mode')
  const [isLogin, setIsLogin] = useState(mode !== 'register')
  
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({})

  useEffect(() => {
    if (mode === 'register') setIsLogin(false)
    else if (mode === 'login') setIsLogin(true)
  }, [mode])

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
    setApiError('')
    
    const newErrors: any = {}
    if (!formData.email) newErrors.email = 'Email required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid format'
    
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
        const result = await login(formData.email, formData.password)
        if (result.error) setApiError(result.error)
        else router.push('/dashboard')
      } else {
        const result = await register(formData.email, formData.password, formData.name)
        if (result.error) setApiError(result.error)
        else if (result.pendingVerification) {
          // In development, pass OTP in URL so user can verify without email
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
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-[var(--color-bg-primary)]">
      
      {/* ─── EDITORIAL BACKDROP ─── */}
      <div className="absolute inset-0 z-0">
         <img 
            src="/collixa_community_lifestyle_1776003104238.png" 
            alt="" 
            className="w-full h-full object-cover opacity-60 dark:opacity-20 grayscale-[20%] brightness-110"
         />
         <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-bg-primary)] via-transparent to-[var(--color-bg-primary)]/40" />
      </div>

      {/* ─── AUTHENTICATION CARD ─── */}
      <div className="relative z-10 w-full max-w-lg px-6 animate-fade-in-up">
        
        {/* HORIZONTAL LOGO */}
        <div 
          className="flex items-center justify-center gap-4 mb-10 cursor-pointer group"
          onClick={() => router.push('/')}
        >
          <div className="w-12 h-12 bg-[var(--color-accent)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/20 transition-all group-hover:scale-105">
            <span className="text-[var(--color-bg-primary)] font-serif font-black text-2xl">C.</span>
          </div>
          <h1 className="text-4xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">Collixa.</h1>
        </div>

        <div className="bg-[var(--color-bg-secondary)]/80 dark:bg-[var(--color-bg-secondary)]/90 backdrop-blur-3xl border border-[var(--color-border)] rounded-[3rem] p-10 md:p-14 shadow-2xl relative">
          
          <div className="text-center mb-10 space-y-2">
             <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)]">Portal</span>
             <h2 className="text-3xl font-serif font-black italic text-[var(--color-text-primary)]">
               {isLogin ? 'Welcome back.' : 'Join your community.'}
             </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 mb-10 bg-[var(--color-bg-primary)]/50 p-1.5 rounded-2xl border border-[var(--color-border)]">
            <button
              onClick={() => { setIsLogin(true); setApiError(''); setErrors({}); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isLogin ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-lg' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setIsLogin(false); setApiError(''); setErrors({}); }}
              className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                !isLogin ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] shadow-lg' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Register
            </button>
          </div>

          {apiError && (
             <div className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 animate-pulse">
                <ShieldCheck size={18} />
                <p className="text-[10px] font-bold uppercase tracking-widest">{apiError}</p>
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                 <label className="editorial-label">Identity Name</label>
                 <Input
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  icon={<User size={16} className="opacity-30" />}
                  className="editorial-input"
                 />
              </div>
            )}

             <div className="space-y-6">
               <div className="space-y-2">
                  <label className="editorial-label">Email Record</label>
                  <Input
                   name="email"
                   type="email"
                   placeholder="name@email.com"
                   value={formData.email}
                   onChange={handleChange}
                   error={errors.email}
                   icon={<Mail size={16} className="opacity-30" />}
                   className="editorial-input"
                  />
               </div>

               <div className="space-y-2">
                  <label className="editorial-label">Secure Access Key</label>
                  <Input
                   name="password"
                   type="password"
                   placeholder="Enter password"
                   value={formData.password}
                   onChange={handleChange}
                   error={errors.password}
                   icon={<Lock size={16} className="opacity-30" />}
                   className="editorial-input"
                  />
               </div>
             </div>

             {!isLogin && (
               <div className="space-y-2">
                  <label className="editorial-label">Confirm Key</label>
                  <Input
                   name="confirmPassword"
                   type="password"
                   placeholder="Confirm password"
                   value={formData.confirmPassword}
                   onChange={handleChange}
                   error={errors.confirmPassword}
                   icon={<Lock size={16} className="opacity-30" />}
                   className="editorial-input"
                  />
               </div>
             )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-[var(--color-accent)] transition-all duration-500 flex items-center justify-center gap-4 group shadow-xl"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <span>{isLogin ? 'Log In' : 'Register Account'}</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
          
          {isLogin && (
            <div className="mt-8 text-center flex items-center justify-between px-2">
               <button onClick={() => router.push('/forgot-password')} className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]">
                 Forgot password?
               </button>
               <p className="text-[8px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter opacity-50">Secured by Collixa</p>
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] leading-loose max-w-xs mx-auto">
          By continuing, you agree to our <span className="text-[var(--color-accent)] border-b border-[var(--color-accent)]/20">Terms of Service</span>
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center font-serif italic text-2xl text-[var(--color-accent)]">Establishing link...</div>}>
      <AuthContent />
    </Suspense>
  )
}
