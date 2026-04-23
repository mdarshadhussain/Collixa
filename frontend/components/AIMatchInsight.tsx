'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/context/AuthContext'
import { API_URL } from '@/lib/supabase'

interface MatchResult {
  score: number
  reasons: string[]
  verdict: string
}

interface AIMatchInsightProps {
  type: 'intent' | 'skill'
  itemId: string
  itemTitle: string
  itemDescription: string
}

export default function AIMatchInsight({ type, itemId, itemTitle, itemDescription }: AIMatchInsightProps) {
  const { user, token } = useAuth()
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatchInsight = async () => {
    if (!user || !token || !itemId) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/ai/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          itemId,
          itemTitle,
          itemDescription
        })
      })

      const data = await response.json()
      if (data.success) {
        setMatchResult(data.data)
      } else {
        setError(data.error || 'Unable to calculate match.')
      }
    } catch (err) {
      console.error('Match insight error:', err)
      setError('AI Service Unavailable')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 bg-[var(--color-bg-primary)] border border-[var(--color-accent)]/20 rounded-[2.5rem] shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
         <Sparkles size={80} className="text-[var(--color-accent)]" />
      </div>
      
      <div className="relative z-10">
         <div className="flex items-center justify-between mb-6">
            <div>
               <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">AI Match Insight</h4>
               <p className="text-[10px] text-[var(--color-text-secondary)] font-bold">Compatibility Profile</p>
            </div>
            {loading ? (
              <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
            ) : matchResult ? (
              <div className="px-3 py-1 bg-[var(--color-accent)] text-black rounded-full font-black text-xs shadow-lg">
                 {matchResult.score}%
              </div>
            ) : null}
         </div>

         {loading ? (
           <div className="space-y-3">
              <div className="h-4 bg-[var(--color-bg-primary)] rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-[var(--color-bg-primary)] rounded animate-pulse w-1/2"></div>
           </div>
         ) : error ? (
           <div className="text-center py-4 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 opacity-60">
                {error.includes('AI Service Unavailable') ? "AI Service is currently offline." : error}
              </p>
              <button 
                onClick={fetchMatchInsight}
                className="text-[9px] font-black uppercase tracking-widest text-[var(--color-accent)] hover:underline"
              >
                Retry Analysis
              </button>
           </div>
         ) : matchResult ? (
            <div className="space-y-6">
              <p className="text-sm md:text-base font-serif font-black italic text-[var(--color-text-primary)] leading-relaxed border-l-4 border-[var(--color-accent)]/30 pl-4 py-1">
                 "{matchResult.verdict}"
              </p>
              <div className="space-y-3">
                 {matchResult.reasons.map((reason, i) => (
                   <div key={i} className="flex gap-3 items-start p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]/50 rounded-2xl">
                      <CheckCircle2 size={14} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                      <p className="text-[11px] md:text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed">{reason}</p>
                   </div>
                 ))}
              </div>
           </div>
         ) : (
           <div className="py-2 text-center">
              <p className="text-[10px] text-[var(--color-text-secondary)] italic mb-6">
                "Analyze how your skills and goals align with this connection."
              </p>
              <button
                onClick={fetchMatchInsight}
                className="w-full py-4 bg-[var(--color-accent)] text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-xl hover:shadow-lg hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> Run AI Analysis
              </button>
           </div>
         )}
      </div>
    </motion.div>
  );
}
