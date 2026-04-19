'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/app/context/AuthContext'

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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
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

  useEffect(() => {
    fetchMatchInsight()
  }, [itemId, user?.id])

  if (!user) return null

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 md:p-8 bg-[var(--color-bg-secondary)] border border-[var(--color-accent)]/20 rounded-[2rem] shadow-xl relative overflow-hidden group"
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
           <div className="text-center py-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-500 opacity-60">{error}</p>
           </div>
         ) : matchResult ? (
           <div className="space-y-4">
              <p className="text-xs font-serif font-black italic text-[var(--color-text-primary)]">
                 "{matchResult.verdict}"
              </p>
              <div className="space-y-2">
                 {matchResult.reasons.map((reason, i) => (
                   <div key={i} className="flex gap-2 items-start">
                      <CheckCircle2 size={12} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                      <p className="text-[10px] text-[var(--color-text-secondary)] font-medium leading-relaxed">{reason}</p>
                   </div>
                 ))}
              </div>
           </div>
         ) : (
           <p className="text-[10px] text-[var(--color-text-secondary)] italic">Analyzing match potential...</p>
         )}
      </div>
    </motion.div>
  )
}
