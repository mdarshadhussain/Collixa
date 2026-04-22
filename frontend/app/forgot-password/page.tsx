'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, CheckCircle, Mail, Loader2, Sparkles, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { checkEmail } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Step 1: Verification check for explicit warning
      const { exists } = await checkEmail(email)
      if (!exists) {
        setError('No account found with this email identity.')
        setLoading(false)
        return
      }

      // Step 2: Dispatch OTP via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (!resetError) {
        setSuccess(true)
      } else {
        setError(resetError.message || 'Failed to dispatch recovery cipher.')
      }
    } catch (err) {
      setError('Connection to security layer failed.')
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
            <div 
              className="flex items-center gap-4 cursor-pointer group mb-20" 
              onClick={() => router.push('/')}
            >
              <h1 className="text-4xl font-serif font-black tracking-tighter text-white">Collixa.</h1>
            </div>

            <div className="space-y-10 max-w-xl">
               <h2 className="text-6xl font-serif font-black leading-[0.9] italic tracking-tighter text-white">
                 Recover your <br /> access.
               </h2>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#F5F5F0]/40 leading-relaxed max-w-xs">
                 Re-establishing encrypted links to your digital workspace.
               </p>
            </div>
         </div>

         <div className="relative z-10 pt-8 border-t border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF85BB]/40 italic">Collixa Recovery Protocol</p>
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
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-accent)]">Security Layer</span>
             <h3 className="text-3xl font-serif font-black text-[var(--color-text-primary)] tracking-tighter">
               Credential Reset.
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
                    <h4 className="text-2xl font-serif font-black italic tracking-tight">Cipher Dispatched.</h4>
                    <p className="text-[11px] font-bold text-[var(--color-text-secondary)] leading-loose">
                      A 6-digit recovery OTP has been sent to 
                      <span className="text-[var(--color-text-primary)] block underline decoration-[var(--color-accent)]/30">{email}</span>
                    </p>
                 </div>
                 <div className="space-y-3">
                    <button
                        onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                        className="w-full py-5 bg-[var(--color-accent)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.5em] rounded-2xl hover:brightness-110 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                      >
                        Enter Recovery OTP
                        <Sparkles size={14} />
                      </button>
                    <button
                        onClick={() => router.push('/auth')}
                        className="w-full py-5 bg-[var(--color-inverse-bg)]/5 text-[var(--color-text-secondary)] text-[10px] font-black uppercase tracking-[0.5em] rounded-2xl hover:bg-[var(--color-inverse-bg)]/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        Return to Portal
                        <ArrowLeft size={14} />
                      </button>
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
                <div className="space-y-6 mb-10">
                  <p className="text-[11px] font-bold text-[var(--color-text-secondary)] leading-relaxed">
                    Provide the email associated with your node to receive a 6-digit recovery OTP.
                  </p>
                </div>

                {error && (
                  <div className="mb-8 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex gap-4 text-red-500 items-center">
                    <ShieldCheck size={18} className="flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] ml-2">Email Address</label>
                    <div className="relative group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="identity@nexus.com"
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl px-6 py-5 text-xs font-bold focus:border-[var(--color-accent)] outline-none transition-all pr-14"
                        required
                        disabled={loading}
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] opacity-30">
                        <Mail size={18} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-6 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.5em] rounded-[1.5rem] hover:bg-[var(--color-accent)] transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-20 group"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        Dispatch Recovery
                        <Sparkles size={14} className="group-hover:scale-125 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-[var(--color-border)] text-center">
                  <button
                    onClick={() => router.push('/auth')}
                    className="flex items-center justify-center gap-3 mx-auto text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors group"
                  >
                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Portal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
