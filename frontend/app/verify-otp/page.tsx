'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Clock, ShieldCheck, RefreshCcw, Loader2 } from 'lucide-react'
import Button from '@/components/Button'
import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const urlOtp = searchParams.get('otp')

  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false)

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.push('/')
    }
  }, [email, router])

  // Auto-fill OTP from URL (development convenience)
  useEffect(() => {
    if (urlOtp && urlOtp.length === 6) {
      setOtp(urlOtp)
    }
  }, [urlOtp])

  // OTP timeout countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otp || otp.length !== 6) {
      setError('Please enter a 6-digit OTP code.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email as string,
        token: otp,
        type: 'signup'
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('Authentication node unreachable. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email as string
      });

      if (!error) {
        setOtp('');
        setTimeLeft(300);
        setCanResend(false);
        setError('');
      } else {
        setError(error.message);
      }
    } catch (err) {
      setError('Protocol error during resend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex font-sans transition-colors duration-700">
      
      {/* ─── VISUAL SECTION (EDITORIAL LEFT) ─── */}
      <div className="hidden lg:flex flex-col flex-1 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] p-20 justify-between relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-accent)]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-4 cursor-pointer group mb-20" onClick={() => router.push('/')}>
              <div className="w-16 h-16 bg-[var(--color-accent)] rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-[var(--color-accent)]/20 transition-transform">
                <span className="text-[var(--color-inverse-text)] font-serif font-black text-4xl">C.</span>
              </div>
              <h1 className="text-4xl font-serif font-black tracking-tighter">Collixa.</h1>
            </div>

            <div className="space-y-10 max-w-xl">
               <h2 className="text-6xl font-serif font-black leading-none italic tracking-tighter">
                 Security Protocols in effect.
               </h2>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] leading-relaxed">
                 Verifying your digital signature ensures the integrity of the Collixa collective.
               </p>
            </div>
         </div>

         <div className="relative z-10 flex items-center gap-6 p-8 rounded-[2rem] bg-[var(--color-bg-primary)] border border-[var(--color-border)] max-w-sm">
            <Clock size={32} className="text-[var(--color-accent)]" />
            <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Temporal Duration</p>
               <p className="text-xl font-bold font-serif italic">Expires in {formatTime(timeLeft)}</p>
            </div>
         </div>
      </div>

      {/* ─── FORM SECTION ─── */}
      <div className="flex-[0.8] flex flex-col justify-center px-8 md:px-24">
        <div className="max-w-md w-full mx-auto space-y-12">
          
          <div className="space-y-4 text-center lg:text-left">
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-accent)]">Identity Verification</span>
             <h3 className="text-3xl font-serif font-black text-[var(--color-text-primary)] tracking-tighter">
               Synchronize Node.
             </h3>
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
            {success ? (
              <div className="py-10 text-center space-y-8 animate-fade-in">
                 <div className="w-24 h-24 rounded-full border border-[var(--color-accent)] flex items-center justify-center mx-auto shadow-xl shadow-[var(--color-accent)]/10">
                    <CheckCircle size={40} className="text-[var(--color-accent)]" />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-3xl font-serif italic text-[var(--color-text-primary)]">Node Authenticated.</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)]">Establishment Complete.</p>
                 </div>
              </div>
            ) : (
              <>
                <div className="space-y-6 mb-12">
                  <p className="text-[11px] font-bold text-[var(--color-text-secondary)] leading-relaxed">
                    A verification code has been dispatched to 
                    <span className="text-[var(--color-text-primary)] block mt-1 underline decoration-[var(--color-accent)]/30 underline-offset-4">{email}</span>
                  </p>
                </div>

                {error && (
                  <div className="mb-10 p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] flex gap-4 text-red-500 animate-shake">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-12">
                  <div className="space-y-4 text-center">
                    <label className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)]">Cipher Entry</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-8 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[2rem] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] text-center text-5xl font-serif font-black tracking-[0.5em] transition-all placeholder:opacity-10 text-[var(--color-accent)]"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-6 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.5em] rounded-[1.5rem] hover:bg-[var(--color-accent)] transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-20"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Validate Credentials'}
                  </button>
                </form>

                {/* Resend Logic */}
                <div className="mt-12 pt-10 border-t border-[var(--color-border)] text-center">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mb-6">Didn't receive the cipher?</p>
                  <button
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className={`flex items-center justify-center gap-4 mx-auto py-4 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      canResend
                        ? 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]'
                        : 'opacity-20 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                    {canResend ? 'Resend Protocol' : `Cooling down (${formatTime(timeLeft)})`}
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => router.push('/auth')}
            className="flex items-center justify-center gap-4 mx-auto text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
            Back to Portal
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center font-serif italic text-2xl text-[var(--color-accent)]">Establishing secure tunnel...</div>}>
       <VerifyOtpContent />
    </Suspense>
  )
}
