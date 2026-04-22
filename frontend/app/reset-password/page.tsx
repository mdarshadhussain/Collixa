'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'next/navigation'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { resetPassword } = useAuth()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please provide your associated email identity.')
      return
    }

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit recovery cipher.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      // Step 1: Verify the recovery OTP with Supabase
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      })

      if (verifyError) {
        setError(verifyError.message)
        setLoading(false)
        return
      }

      // Step 2: Since verifyOtp logs the user in, we can now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth')
        }, 3000)
      }
    } catch (err) {
      setError('Credential synchronization failed.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex font-sans overflow-hidden">
      
      {/* ─── LEFT PANEL (EDITORIAL) ─── */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#021A54] p-20 justify-between relative overflow-hidden">
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF85BB] rounded-full blur-[160px] opacity-20" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-4 cursor-pointer group mb-20" onClick={() => router.push('/')}>
               <h1 className="text-4xl font-serif font-black tracking-tighter text-white">Collixa.</h1>
            </div>

            <div className="space-y-10 max-w-xl">
               <h2 className="text-6xl font-serif font-black leading-[0.9] italic tracking-tighter text-white">
                 Define your <br /> new cipher.
               </h2>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F5F5F0]/40 leading-relaxed max-w-xs">
                 Establishing a new encrypted gateway to your workspace.
               </p>
            </div>
         </div>

         <div className="relative z-10 pt-8 border-t border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF85BB]/40 italic">Collixa Identity Protocol</p>
         </div>
      </div>

      {/* ─── RIGHT PANEL (FORM) ─── */}
      <div className="flex-[1.2] flex flex-col justify-center px-8 md:px-24 bg-[var(--color-bg-primary)]">
        <div className="max-w-md w-full mx-auto space-y-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-accent)]">Identity Finalization</span>
             <h3 className="text-3xl font-serif font-black text-[var(--color-text-primary)] tracking-tighter">
               Update Credentials.
             </h3>
          </motion.div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[3rem] p-10 md:p-12 shadow-2xl text-center space-y-8"
              >
                 <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-green-500" />
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-2xl font-serif italic font-black tracking-tight">Identity Restored.</h4>
                    <p className="text-[11px] font-bold text-[var(--color-text-secondary)] leading-loose">
                      Your credentials have been updated. Re-routing to authentication portal...
                    </p>
                 </div>
                 <div className="w-full h-1 bg-[var(--color-bg-primary)] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3 }}
                      className="h-full bg-[var(--color-accent)]"
                    />
                 </div>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden"
              >
                {error && (
                  <div className="mb-8 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex gap-4 text-red-500 items-center">
                    <ShieldCheck size={18} className="flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleReset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] ml-2">Email Identity</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="identity@nexus.com"
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-xs font-bold focus:border-[var(--color-accent)] outline-none transition-all"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] ml-2">Recovery Cipher (OTP)</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-4 text-center text-3xl font-black tracking-[0.4em] focus:border-[var(--color-accent)] outline-none transition-all text-[var(--color-accent)]"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] ml-2">New Password</label>
                    <div className="relative group">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-5 text-xs font-bold focus:border-[var(--color-accent)] outline-none transition-all pr-14"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] opacity-30 hover:opacity-100 transition-opacity"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] ml-2">Confirm Authorization</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-5 text-xs font-bold focus:border-[var(--color-accent)] outline-none transition-all pr-14"
                        required
                        disabled={loading}
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] opacity-30">
                        <Lock size={18} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword || !otp || !email}
                    className="w-full py-5 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-[var(--color-accent)] transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-20 group mt-4"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        Update Credentials
                        <Sparkles size={14} className="group-hover:scale-125 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
                   <p className="text-[8px] font-black tracking-widest uppercase text-[var(--color-text-secondary)] opacity-30">
                     Encryption Level: AES-256 Equivalent
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center font-serif italic text-2xl text-[var(--color-accent)]">Establishing link...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
