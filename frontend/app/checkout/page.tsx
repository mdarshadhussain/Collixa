'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, CreditCard, Lock, ShieldCheck, Loader2, Sparkles } from 'lucide-react'
import Header from '@/components/Header'

const PACKAGES = {
  'starter': { name: 'Curious Case', credits: 100, price: '$5', color: 'from-blue-400 to-indigo-500' },
  'pro': { name: 'Collector', credits: 250, price: '$10', color: 'from-amber-400 to-orange-500' },
  'premium': { name: 'Architect', credits: 750, price: '$25', color: 'from-emerald-400 to-teal-600' },
  'ultimate': { name: 'The Editorial', credits: 2000, price: '$50', color: 'from-rose-400 to-purple-600' }
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get('package') || 'starter'
  const pkg = (PACKAGES as any)[packageId] || PACKAGES.starter

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  })

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === 'cardNumber') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '')
      // Group by 4
      formattedValue = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly
      if (digitsOnly.length > 16) return // Max 16 digits
    }

    if (field === 'expiry') {
      const digitsOnly = value.replace(/\D/g, '')
      if (digitsOnly.length > 4) return
      if (digitsOnly.length > 2) {
        formattedValue = `${digitsOnly.slice(0, 2)} / ${digitsOnly.slice(2)}`
      } else {
        formattedValue = digitsOnly
      }
    }

    if (field === 'cvv') {
      const digitsOnly = value.replace(/\D/g, '')
      if (digitsOnly.length > 3) return
      formattedValue = digitsOnly
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Final Validations
    if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Card number must be 16 digits')
      return
    }
    if (formData.cvv.length !== 3) {
      setError('CVV must be exactly 3 digits')
      return
    }

    setProcessing(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setError('Your session has expired. Please log in again.')
        setProcessing(false)
        return
      }

      const response = await fetch(`${API_URL}/api/credits/simulate-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageId })
      })

      if (response.ok) {
        // High-end simulated delay for the "Verification" feel
        await new Promise(resolve => setTimeout(resolve, 3000))
        router.push(`/payment/success?package=${packageId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Identity verification failed')
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Connectivity lost. Re-establishing link...')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans">
      <Header />
      
      <main className="max-w-5xl lg:max-w-[1300px] mx-auto px-4 py-6 md:py-12 lg:py-24 min-h-[calc(100vh-80px)] flex items-center">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest animate-pulse">
            Error: {error}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-16 lg:gap-24 items-stretch lg:items-center justify-between w-full">
          
          {/* ─── LEFT: ORDER SUMMARY ─── */}
          <div className="w-full lg:flex-1 lg:max-w-[600px] space-y-6 md:space-y-8">
            <button 
              onClick={() => router.back()}
              className="group flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Retreat
            </button>

            <div className="space-y-3 md:space-y-4">
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] italic">Verification</span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tighter leading-tight">
                Finalize your <br />
                <span className="italic font-light text-[var(--color-accent)]">Manifestation.</span>
              </h1>
            </div>

            <div className="p-5 sm:p-8 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${pkg.color} opacity-10 blur-3xl`} />
              
              <div className="relative space-y-5 md:space-y-6">
                <div className="flex flex-row justify-between items-end gap-4">
                   <div>
                     <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-1">Tier</p>
                     <h2 className="text-xl md:text-2xl font-serif font-black">{pkg.name}</h2>
                   </div>
                   <div className="text-right">
                     <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] mb-1">Allocation</p>
                     <p className="text-lg md:text-xl font-serif font-black">{pkg.credits} Credits</p>
                   </div>
                </div>

                <div className="pt-5 md:pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
                  <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Total</p>
                  <p className="text-2xl md:text-3xl font-serif font-black text-[var(--color-accent)]">{pkg.price}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 md:gap-8 opacity-60">
               <div className="flex items-center gap-2">
                 <ShieldCheck size={14} className="text-[var(--color-accent)]" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Encrypted</span>
               </div>
               <div className="flex items-center gap-2">
                 <Lock size={14} className="text-[var(--color-accent)]" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Protected</span>
               </div>
            </div>
          </div>

          {/* ─── RIGHT: PAYMENT FORM ─── */}
          <div className="w-full lg:w-[480px]">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-5 sm:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-center mb-5 md:mb-6">
                   <div className="inline-flex p-2.5 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)] mb-3">
                      <CreditCard size={18} className="text-[var(--color-accent)]" />
                   </div>
                   <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)]">Secure Protocol</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-2 mb-1 block">Cardholder</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Name"
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 md:px-5 py-3 text-[11px] md:text-xs font-bold focus:border-[var(--color-accent)] outline-none transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-2 mb-1 block">Card Number</label>
                    <input 
                      required
                      type="text" 
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 md:px-5 py-3 text-[11px] md:text-xs font-mono focus:border-[var(--color-accent)] outline-none transition-all"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-2 mb-1 block">Expiry</label>
                      <input 
                        required
                        type="text" 
                        placeholder="MM / YY"
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 md:px-5 py-3 text-[11px] md:text-xs font-mono focus:border-[var(--color-accent)] outline-none transition-all"
                        value={formData.expiry}
                        onChange={(e) => handleInputChange('expiry', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-2 mb-1 block">CVV</label>
                      <input 
                        required
                        type="text" 
                        placeholder="000"
                        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 md:px-5 py-3 text-[11px] md:text-xs font-mono focus:border-[var(--color-accent)] outline-none transition-all"
                        value={formData.cvv}
                        onChange={(e) => handleInputChange('cvv', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 md:pt-4">
                  <button 
                    disabled={processing}
                    type="submit"
                    className="w-full py-3.5 md:py-4 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] text-[9px] font-black uppercase tracking-[0.4em] rounded-xl hover:bg-[var(--color-accent)] transition-all shadow-lg shadow-black/5 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                  >
                    {processing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        Initiate
                        <Sparkles size={12} className="group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="text-center mt-4 text-[7px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40">
                    Collixa Secure Gateway
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-accent)]" size={48} />
       </div>
    }>
       <CheckoutContent />
    </Suspense>
  )
}
