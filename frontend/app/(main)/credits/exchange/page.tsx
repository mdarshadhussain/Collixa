'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Gift, ShoppingBag, Coffee, Car, 
  Zap, Loader2, CheckCircle2, Sparkles, CreditCard,
  ChevronRight, Search, Filter, ShieldCheck, Ticket
} from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { notify } from '@/lib/utils'
import Header from '@/components/Header'

const GIFT_CARDS = [
  { 
    id: 'grab-50', 
    provider: 'Grab', 
    name: 'Grab Transport / Food',
    value: '50,000 VND',
    credits: 50, 
    color: 'from-emerald-400 to-emerald-600', 
    icon: Car,
    category: 'Transport'
  },
  { 
    id: 'grab-100', 
    provider: 'Grab', 
    name: 'Grab Transport / Food',
    value: '100,000 VND',
    credits: 100, 
    color: 'from-emerald-500 to-emerald-700', 
    icon: Car,
    category: 'Transport'
  },
  { 
    id: 'shopee-50', 
    provider: 'Shopee', 
    name: 'Shopee Shopping Voucher',
    value: '50,000 VND',
    credits: 50, 
    color: 'from-orange-400 to-orange-600', 
    icon: ShoppingBag,
    category: 'E-commerce'
  },
  { 
    id: 'shopee-100', 
    provider: 'Shopee', 
    name: 'Shopee Shopping Voucher',
    value: '100,000 VND',
    credits: 100, 
    color: 'from-orange-500 to-orange-700', 
    icon: ShoppingBag,
    category: 'E-commerce'
  },
  { 
    id: 'xanhsm-50', 
    provider: 'Xanh SM', 
    name: 'Xanh SM (Be/Sun SM) Ride',
    value: '50,000 VND',
    credits: 50, 
    color: 'from-cyan-400 to-blue-500', 
    icon: Zap,
    category: 'Transport'
  },
  { 
    id: 'highlands-50', 
    provider: 'Highlands', 
    name: 'Highlands Coffee Voucher',
    value: '50,000 VND',
    credits: 50, 
    color: 'from-red-600 to-red-800', 
    icon: Coffee,
    category: 'Lifestyle'
  },
  { 
    id: 'lazada-50', 
    provider: 'Lazada', 
    name: 'Lazada Shopping Voucher',
    value: '50,000 VND',
    credits: 50, 
    color: 'from-indigo-500 to-purple-600', 
    icon: ShoppingBag,
    category: 'E-commerce'
  },
  { 
    id: 'koi-50', 
    provider: 'KOI Thé', 
    name: 'KOI Thé Beverage Voucher',
    value: '50,000 VND',
    credits: 50, 
    color: 'from-yellow-600 to-amber-800', 
    icon: Coffee,
    category: 'Lifestyle'
  }
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function GiftCardExchangePage() {
  const router = useRouter()
  const { user, refreshUser, token } = useAuth()
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [redemptionData, setRedemptionData] = useState<any>(null)
  const [fetchingHistory, setFetchingHistory] = useState(true)

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/credits/redemptions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setHistory(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setFetchingHistory(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchHistory()
    }
  }, [token])

  const filteredCards = GIFT_CARDS.filter(card => 
    card.provider.toLowerCase().includes(searchQuery.toLowerCase()) || 
    card.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRedeem = async () => {
    if (!selectedCard) return
    if ((user?.credits || 0) < selectedCard.credits) {
      notify.error('Insufficient credits for this redemption')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/credits/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: selectedCard.id,
          amount: selectedCard.credits,
          provider: selectedCard.provider
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setRedemptionData(data.data)
        await refreshUser()
        fetchHistory() // Refresh history
      } else {
        notify.error(data.error || 'Redemption failed')
      }
    } catch (err) {
      notify.error('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const closeRedemptionModal = () => {
    if (loading) return
    setSelectedCard(null)
    setSuccess(false)
    setRedemptionData(null)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans pb-32 md:pb-20">
      
      {/* ─── NAVIGATION ─── */}
      <div className="max-w-[1500px] mx-auto px-4 pt-6 md:pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => router.back()}
          className="w-full md:w-auto p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl hover:bg-[var(--color-bg-primary)] transition-all flex items-center justify-center md:justify-start gap-3 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          Back to Wallet
        </button>
        
        <div className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] px-6 py-4 md:py-3 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between md:justify-start gap-4">
           <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40">Available Balance</span>
              <span className="text-xl md:text-xl font-serif font-black italic tracking-tight leading-none mt-1">{user.credits || 0} Creds</span>
           </div>
           <div className="w-10 h-10 bg-[var(--color-accent)] rounded-xl flex items-center justify-center text-black shadow-lg">
              <CreditCard size={18} />
           </div>
        </div>
      </div>

      <main className="max-w-[1500px] mx-auto px-4 mt-8 md:mt-12 space-y-12 md:space-y-20">
        
        {/* ─── HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12">
           <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-accent-soft)]/20 rounded-full border border-[var(--color-accent)]/20">
                <Sparkles size={10} className="text-[var(--color-accent)]" />
                <span className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">Voucher Marketplace</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-black italic tracking-tighter text-[var(--color-text-primary)]">Exchange.</h1>
              <p className="text-[10px] md:text-[11px] font-medium text-[var(--color-text-secondary)] opacity-60 max-w-xl leading-relaxed">
                Convert your digital influence into tangible real-world rewards. 1 Credit = 1,000 VND parity. Select from our curated list of regional partners in Vietnam.
              </p>
           </div>

           <div className="relative w-full md:w-96 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-accent)] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl pl-14 pr-6 py-4 md:py-5 text-[11px] font-bold outline-none focus:border-[var(--color-accent)] transition-all shadow-sm"
              />
           </div>
        </div>

        {/* ─── REWARDS GRID ─── */}
        <div className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pb-8 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
           {filteredCards.map((card) => (
             <motion.div
               key={card.id}
               whileHover={{ y: -5 }}
               className="flex-none w-[75vw] sm:w-[45vw] md:w-auto snap-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2rem] md:rounded-[2.5rem] p-6 flex flex-col justify-between group hover:border-[var(--color-accent)]/50 transition-all shadow-sm hover:shadow-2xl overflow-hidden relative"
             >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-[0.03] rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-10 transition-opacity`} />
                
                <div className="space-y-6 relative z-10">
                   <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <card.icon size={28} strokeWidth={2.5} />
                   </div>
                   
                   <div className="min-h-[80px]">
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">{card.category}</span>
                      <h3 className="text-xl font-serif font-black text-[var(--color-text-primary)] mt-1 line-clamp-1">{card.provider}</h3>
                      <p className="text-[10px] font-medium text-[var(--color-text-secondary)] opacity-60 mt-1 line-clamp-2">{card.name}</p>
                   </div>

                   <div className="bg-[var(--color-bg-primary)]/50 rounded-2xl p-4 flex items-center justify-between border border-[var(--color-border)]">
                      <div className="flex flex-col">
                         <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Value</span>
                         <span className="text-sm font-black text-[var(--color-text-primary)]">{card.value}</span>
                      </div>
                      <div className="flex flex-col items-end">
                         <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Cost</span>
                         <span className="text-sm font-serif font-black text-[var(--color-accent)] italic">{card.credits} CR</span>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => setSelectedCard(card)}
                  disabled={ (user?.credits || 0) < card.credits }
                  className={`w-full mt-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-2 transition-all ${
                    (user?.credits || 0) >= card.credits 
                      ? 'bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] hover:bg-[var(--color-accent)]' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  }`}
                >
                   { (user?.credits || 0) >= card.credits ? 'Exchange' : 'Low Creds' }
                   <ChevronRight size={14} />
                </button>
             </motion.div>
           ))}
        </div>

        {/* ─── REDEMPTION HISTORY (VOUCHER VAULT) ─── */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--color-accent-soft)]/20 rounded-2xl">
                 <Ticket size={24} className="text-[var(--color-accent)]" />
              </div>
              <div>
                 <h2 className="text-3xl font-serif font-black tracking-tight text-[var(--color-text-primary)]">Voucher Vault.</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-secondary)] opacity-40 mt-1">Your Redemption History</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fetchingHistory ? (
                <div className="col-span-2 py-20 flex flex-col items-center justify-center opacity-40">
                   <Loader2 size={32} className="animate-spin mb-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Accessing Vault...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="col-span-2 py-20 bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)] rounded-[3rem] flex flex-col items-center justify-center text-center px-12">
                   <Gift size={48} className="text-[var(--color-text-secondary)] opacity-20 mb-6" />
                   <h3 className="text-xl font-serif font-black text-[var(--color-text-primary)] opacity-40 italic">Vault is Empty.</h3>
                   <p className="text-[10px] font-medium text-[var(--color-text-secondary)] opacity-40 mt-2 max-w-xs">Your redeemed vouchers and their security codes will appear here once processed.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group hover:shadow-xl transition-all">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] group-hover:scale-110 transition-transform">
                           <Ticket size={28} />
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h4 className="text-lg font-serif font-black text-[var(--color-text-primary)]">{item.provider} Voucher</h4>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase tracking-widest rounded-full">{item.status}</span>
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-50 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                           <div className="flex items-center gap-4 mt-3">
                              <div className="flex flex-col">
                                 <span className="text-[7px] font-black uppercase tracking-widest opacity-30">Code</span>
                                 <span className="text-[11px] font-mono font-black text-[var(--color-text-primary)]">{item.voucher_code}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[7px] font-black uppercase tracking-widest opacity-30">PIN</span>
                                 <span className="text-[11px] font-mono font-black text-[var(--color-text-primary)]">{item.voucher_pin}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-serif font-black italic text-[var(--color-accent)]">{item.amount} CR</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40 mt-1">Magnitude</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </section>

        {/* ─── FOOTER INFO ─── */}
        <div className="bg-[#001233] rounded-[3rem] p-12 relative overflow-hidden group border border-white/5">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-accent)]/5 rounded-full blur-[100px] pointer-events-none" />
           <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
              <div className="space-y-6 text-center md:text-left">
                 <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-[var(--color-accent)] shadow-2xl border border-white/10">
                    <ShieldCheck size={32} />
                 </div>
                 <div className="max-w-xl">
                    <h2 className="text-3xl font-serif font-black text-white italic tracking-tight">Verified Redemption.</h2>
                    <p className="text-[12px] font-medium text-white/50 leading-relaxed mt-4">
                       All redemptions are processed through authorized digital distribution channels. Once an exchange is initiated, the credit amount is locked in the treasury and the voucher code is generated instantly for your security.
                    </p>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center">
                    <p className="text-2xl font-serif font-black text-white italic">INSTANT</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">Delivery</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 text-center">
                    <p className="text-2xl font-serif font-black text-white italic">100%</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mt-1">Authentic</p>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* ─── REDEMPTION MODAL ─── */}
      <AnimatePresence>
        {selectedCard && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeRedemptionModal}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
            >
               {success && redemptionData ? (
                 <div className="text-center py-6 space-y-8">
                    <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/30">
                       <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-4xl font-serif font-black italic tracking-tighter text-[#001233]">Exchange Successful.</h2>
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Digital Asset Secured</p>
                    </div>
                    
                    <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 space-y-6">
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-600 mb-2">Voucher Code</span>
                          <span className="text-3xl font-mono font-black text-[#001233] tracking-wider">{redemptionData.voucher_code}</span>
                       </div>
                       <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-emerald-600 mb-2">Security PIN</span>
                          <span className="text-3xl font-mono font-black text-[#001233] tracking-[1em] pl-[1em]">{redemptionData.voucher_pin}</span>
                       </div>
                    </div>

                    <button 
                      onClick={closeRedemptionModal}
                      className="w-full py-5 bg-[#001233] text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-emerald-500 transition-all shadow-xl"
                    >
                       Done
                    </button>

                    <p className="text-[9px] font-medium text-slate-400">This code is now stored in your Voucher Vault.</p>
                 </div>
               ) : (
                 <div className="space-y-8">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] italic">Redemption Node</span>
                          <h2 className="text-3xl font-serif font-black italic tracking-tighter text-[#001233]">Confirm Action.</h2>
                       </div>
                       <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedCard.color} flex items-center justify-center text-white shadow-xl`}>
                          <selectedCard.icon size={28} strokeWidth={2.5} />
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-4">
                       <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Provider</span>
                          <span className="text-[#001233] font-black">{selectedCard.provider}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Value</span>
                          <span className="text-[#001233] font-black">{selectedCard.value}</span>
                       </div>
                       <div className="h-[1px] bg-slate-200" />
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Transaction Cost</span>
                          <span className="text-2xl font-serif font-black italic text-[var(--color-accent)]">{selectedCard.credits} CR</span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                       <button 
                         onClick={handleRedeem}
                         disabled={loading}
                         className="w-full py-5 bg-[#001233] text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-[var(--color-accent)] hover:text-black transition-all shadow-xl flex items-center justify-center gap-3"
                       >
                          {loading ? <Loader2 size={18} className="animate-spin" /> : <><Ticket size={16} /> Execute Exchange</>}
                       </button>
                       <button 
                         onClick={closeRedemptionModal}
                         disabled={loading}
                         className="w-full py-5 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-slate-50 transition-all"
                       >
                          Abort Protocol
                       </button>
                    </div>

                    <p className="text-center text-[7px] font-black uppercase tracking-[0.3em] opacity-30 italic">Credits will be deducted upon execution</p>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
